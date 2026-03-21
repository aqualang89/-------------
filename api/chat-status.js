import { getMode, popManualReplies } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const mode = await getMode(sessionId);
    const pending = await popManualReplies(sessionId);

    return res.status(200).json({ mode, pending });
  } catch (error) {
    console.error('CHAT STATUS ERROR:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
