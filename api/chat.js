import { askAquariumAI } from '../lib/ai.js';
import { addUserMessage, addAssistantMessage } from '../lib/store.js';
import { sendOwnerCard } from '../lib/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sessionId, text } = req.body || {};

    if (!sessionId || !text) {
      return res.status(400).json({ error: 'sessionId and text are required' });
    }

    let session = await addUserMessage(sessionId, text);

    if (session.mode === 'manual') {
      await sendOwnerCard({
        sessionId,
        userText: text,
        aiReply: null,
        mode: session.mode
      });

      return res.status(200).json({
        reply: 'Сообщение передано специалисту студии. Он ответит вручную.',
        mode: 'manual'
      });
    }

    const aiReply = await askAquariumAI(session.messages);
    session = await addAssistantMessage(sessionId, aiReply, { manual: false });

    await sendOwnerCard({
      sessionId,
      userText: text,
      aiReply,
      mode: session.mode
    });

    return res.status(200).json({ reply: aiReply, mode: session.mode });
  } catch (error) {
    console.error('CHAT ERROR', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
