import { Redis } from 'ioredis';

let client;
let memoryClient;

function getMemoryClient() {
  if (!memoryClient) {
    const store = new Map();
    memoryClient = {
      get: async (k) => store.get(k) || null,
      set: async (k, v, opts) => { store.set(k, String(v)); },
      rpush: async (k, v) => {
        const arr = JSON.parse(store.get(k) || '[]');
        arr.push(v);
        store.set(k, JSON.stringify(arr));
      },
      lrange: async (k, start, end) => {
        const arr = JSON.parse(store.get(k) || '[]');
        return end === -1 ? arr : arr.slice(start, end + 1);
      },
      del: async (k) => store.delete(k),
      expire: async () => {},
    };
  }
  return memoryClient;
}

async function getRedis() {
  if (!process.env.REDIS_URL) {
    return getMemoryClient();
  }

  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });

    client.on('error', (err) => {
      console.error('REDIS ERROR:', err.message);
    });
  }

  return client;
}

const modeKey = (sessionId) => `chat:${sessionId}:mode`;
const historyKey = (sessionId) => `chat:${sessionId}:history`;
const pendingKey = (sessionId) => `chat:${sessionId}:pending`;

export async function getMode(sessionId) {
  const redis = await getRedis();
  return (await redis.get(modeKey(sessionId))) || 'ai';
}

export async function setMode(sessionId, mode) {
  const redis = await getRedis();
  await redis.set(modeKey(sessionId), mode, 'EX', 60 * 60 * 24 * 7);
}

export async function addHistory(sessionId, role, content) {
  const redis = await getRedis();
  const item = JSON.stringify({ role, content, ts: Date.now() });
  await redis.rpush(historyKey(sessionId), item);
  await redis.expire(historyKey(sessionId), 60 * 60 * 24 * 7);
}

export async function getHistory(sessionId) {
  const redis = await getRedis();
  const items = await redis.lrange(historyKey(sessionId), 0, -1);
  return (items || []).map((x) => JSON.parse(x));
}

export async function queueManualReplyForSite(sessionId, content) {
  const redis = await getRedis();
  const item = JSON.stringify({ role: 'assistant', content, ts: Date.now() });
  await redis.rpush(pendingKey(sessionId), item);
  await redis.expire(pendingKey(sessionId), 60 * 60 * 24 * 7);
}

export async function popManualReplies(sessionId) {
  const redis = await getRedis();
  const items = await redis.lrange(pendingKey(sessionId), 0, -1);
  await redis.del(pendingKey(sessionId));
  return (items || []).map((x) => JSON.parse(x));
}

// ===== IDEMPOTENCY =====
// Используется в /api/order чтобы один и тот же заказ при retry/double-click
// не создавался дважды. В Vercel serverless БЕЗ Redis (REDIS_URL не задан) защита
// работать НЕ будет — каждый instance имеет свою memory Map. Подключить Vercel KV
// или Upstash Redis для production-уровня.
const idempotencyKey = (key) => `idempotency:${key}`;

export async function getIdempotency(key) {
  const redis = await getRedis();
  return await redis.get(idempotencyKey(key));
}

export async function setIdempotency(key, value, ttlSeconds = 300) {
  const redis = await getRedis();
  await redis.set(idempotencyKey(key), String(value), 'EX', ttlSeconds);
}
