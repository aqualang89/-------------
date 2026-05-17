import { Redis } from 'ioredis';

// Используем тот же Redis что и store.js — но локальный модуль чтобы не плодить
// циклические зависимости. Если REDIS_URL не задан — используем in-memory Map с TTL,
// что для local dev / fallback ок (на serverless это деградация защиты, но не худшая —
// в худшем случае каждый instance считает свой счётчик).
let client;
const memStore = new Map(); // key -> { count, resetAt }

function getMemoryClient() {
  return {
    incr: async (k) => {
      const now = Date.now();
      const rec = memStore.get(k);
      if (!rec || rec.resetAt <= now) {
        memStore.set(k, { count: 1, resetAt: now + 60_000 });
        return 1;
      }
      rec.count += 1;
      return rec.count;
    },
    expire: async (k, sec) => {
      const rec = memStore.get(k);
      if (rec) rec.resetAt = Date.now() + sec * 1000;
    },
    ttl: async (k) => {
      const rec = memStore.get(k);
      if (!rec) return -2;
      const left = Math.ceil((rec.resetAt - Date.now()) / 1000);
      return left > 0 ? left : -2;
    },
  };
}

async function getRedis() {
  if (!process.env.REDIS_URL) return getMemoryClient();
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
    client.on('error', (err) => console.error('REDIS ERROR (rate-limit):', err.message));
  }
  return client;
}

export function getClientIp(event) {
  // Vercel прокси кладёт реальный IP первым в x-forwarded-for.
  const xff = getHeader(event, 'x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return getHeader(event, 'x-real-ip') || 'unknown';
}

/**
 * Проверяет лимит. Если превышен — кидает 429.
 * @param {object} event — H3 event
 * @param {object} opts
 * @param {string} opts.bucket — название бакета (contact, order, chat, admin-auth и т.д.)
 * @param {number} opts.max — максимум запросов в окне
 * @param {number} opts.windowSec — длина окна в секундах
 * @param {string} [opts.id] — кастомный идентификатор; по умолчанию IP клиента
 */
export async function checkRateLimit(event, { bucket, max, windowSec, id }) {
  const redis = await getRedis();
  const ident = id || getClientIp(event);
  const key = `ratelimit:${bucket}:${ident}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // первый запрос в окне — ставим TTL
      await redis.expire(key, windowSec);
    }
    if (count > max) {
      const ttl = await redis.ttl(key);
      const retryAfter = ttl > 0 ? ttl : windowSec;
      setHeader(event, 'Retry-After', String(retryAfter));
      throw createError({
        statusCode: 429,
        statusMessage: `Слишком много запросов. Попробуйте через ${Math.ceil(retryAfter / 60)} мин.`,
      });
    }
    return { count, remaining: Math.max(0, max - count) };
  } catch (e) {
    // Если это наш 429 — пробрасываем
    if (e?.statusCode === 429) throw e;
    // Иначе (Redis отвалился etc) — fail-open, не блокируем легитимных юзеров
    console.error('[rate-limit] check failed (fail-open):', e?.message);
    return { count: 0, remaining: max };
  }
}
