import kv from '@vercel/kv';

function emptySession(sessionId) {
  return {
    id: sessionId,
    mode: 'ai',
    messages: [],
    pendingForSite: [],
    updatedAt: Date.now()
  };
}

export async function getSession(sessionId) {
  const session = await kv.get(`chat:${sessionId}`);
  return session || emptySession(sessionId);
}

export async function saveSession(session) {
  session.updatedAt = Date.now();
  await kv.set(`chat:${session.id}`, session);
  return session;
}

export async function setMode(sessionId, mode) {
  const session = await getSession(sessionId);
  session.mode = mode;
  return saveSession(session);
}

export async function addUserMessage(sessionId, text) {
  const session = await getSession(sessionId);
  session.messages.push({ role: 'user', content: text, ts: Date.now() });
  return saveSession(session);
}

export async function addAssistantMessage(sessionId, text, meta = {}) {
  const session = await getSession(sessionId);
  session.messages.push({ role: 'assistant', content: text, ts: Date.now(), ...meta });
  return saveSession(session);
}

export async function queueManualReplyForSite(sessionId, text) {
  const session = await getSession(sessionId);
  const item = { role: 'assistant', content: text, manual: true, ts: Date.now() };
  session.pendingForSite.push(item);
  session.messages.push(item);
  return saveSession(session);
}

export async function popPendingForSite(sessionId) {
  const session = await getSession(sessionId);
  const pending = session.pendingForSite || [];
  session.pendingForSite = [];
  await saveSession(session);
  return { mode: session.mode, pending };
}
