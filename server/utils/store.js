import { createClient } from 'redis';

let client;
let connectPromise;
let memoryClient;

function getMemoryClient() {
  if (!memoryClient) {
    const store = new Map();
    memoryClient = {
      get: async (k) => store.get(k) || null,
      set: async (k, v, opts) => { store.set(k, String(v)); },
      rPush: async (k, v) => {
        const arr = JSON.parse(store.get(k) || '[]');
        arr.push(v);
        store.set(k, JSON.stringify(arr));
      },
      lRange: async (k, start, end) => {
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
    client = createClient({
      url: process.env.REDIS_URL
    });

    client.on('error', (err) => {
      console.error('REDIS ERROR:', err);
    });

    connectPromise = client.connect();
  }

  await connectPromise;
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
  await redis.set(modeKey(sessionId), mode, {
    EX: 60 * 60 * 24 * 7
  });
}

export async function addHistory(sessionId, role, content) {
  const redis = await getRedis();
  const item = JSON.stringify({ role, content, ts: Date.now() });

  await redis.rPush(historyKey(sessionId), item);
  await redis.expire(historyKey(sessionId), 60 * 60 * 24 * 7);
}

export async function getHistory(sessionId) {
  const redis = await getRedis();
  const items = await redis.lRange(historyKey(sessionId), 0, -1);
  return (items || []).map((x) => JSON.parse(x));
}

export async function queueManualReplyForSite(sessionId, content) {
  const redis = await getRedis();
  const item = JSON.stringify({ role: 'assistant', content, ts: Date.now() });

  await redis.rPush(pendingKey(sessionId), item);
  await redis.expire(pendingKey(sessionId), 60 * 60 * 24 * 7);
}

export async function popManualReplies(sessionId) {
  const redis = await getRedis();
  const items = await redis.lRange(pendingKey(sessionId), 0, -1);
  await redis.del(pendingKey(sessionId));
  return (items || []).map((x) => JSON.parse(x));
}
