import { getMode, popManualReplies } from '~/server/utils/store.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { sessionId } = body || {};

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'sessionId is required' });
  }

  const mode = await getMode(sessionId);
  const pending = await popManualReplies(sessionId);

  return { mode, pending };
});
