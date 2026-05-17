import { Redis } from 'ioredis';
import { getClientIp } from './rate-limit.js';

// Защита от brute-force админского пароля:
// после MAX_FAILS неудачных попыток с одного IP блокируем на WINDOW_SEC.
// Успешные логины счётчик НЕ инкрементят — иначе сам Дмитрий может себя заблокировать.
const MAX_FAILS = 5;
const WINDOW_SEC = 15 * 60;

let client;
const memCounters = new Map(); // ip -> { count, resetAt }

function getMem() {
  return {
    incr: async (k) => {
      const now = Date.now();
      const rec = memCounters.get(k);
      if (!rec || rec.resetAt <= now) {
        memCounters.set(k, { count: 1, resetAt: now + WINDOW_SEC * 1000 });
        return 1;
      }
      rec.count += 1;
      return rec.count;
    },
    expire: async (k, sec) => {
      const rec = memCounters.get(k);
      if (rec) rec.resetAt = Date.now() + sec * 1000;
    },
    get: async (k) => {
      const rec = memCounters.get(k);
      if (!rec || rec.resetAt <= Date.now()) return null;
      return String(rec.count);
    },
  };
}

async function getRedis() {
  if (!process.env.REDIS_URL) return getMem();
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
    client.on('error', (err) => console.error('REDIS ERROR (admin-auth):', err.message));
  }
  return client;
}

const failKey = (ip) => `admin-fail:${ip}`;

async function getFailCount(ip) {
  try {
    const r = await getRedis();
    const v = await r.get(failKey(ip));
    return v ? parseInt(v, 10) : 0;
  } catch {
    return 0; // fail-open чтобы Redis-сбой не запер Дмитрия
  }
}

async function recordFailure(ip) {
  try {
    const r = await getRedis();
    const count = await r.incr(failKey(ip));
    if (count === 1) await r.expire(failKey(ip), WINDOW_SEC);
    return count;
  } catch (e) {
    console.error('[admin-auth] record failure failed:', e?.message);
    return 0;
  }
}

/**
 * Проверка админских прав. Кидает:
 *  - 429 если IP заблокирован после серии неудач
 *  - 403 если пароль неверный (с инкрементом счётчика)
 * При успехе — ничего не возвращает (тихо проходит дальше).
 */
export async function requireAdmin(event) {
  const ip = getClientIp(event);

  const fails = await getFailCount(ip);
  if (fails >= MAX_FAILS) {
    setHeader(event, 'Retry-After', String(WINDOW_SEC));
    throw createError({
      statusCode: 429,
      statusMessage: 'Слишком много неудачных попыток. Попробуйте через 15 минут.',
    });
  }

  const password = getHeader(event, 'x-admin-password');
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    await recordFailure(ip);
    throw createError({ statusCode: 403, statusMessage: 'Неверный пароль' });
  }
}
