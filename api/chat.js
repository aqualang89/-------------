import {
  addHistory,
  getHistory,
  getMode
} from '../lib/store.js';
import { sendOwnerCard } from '../lib/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sessionId, text } = req.body || {};

    if (!sessionId || !text || !text.trim()) {
      return res.status(400).json({ error: 'sessionId and text are required' });
    }

    const cleanText = text.trim();

    const previousHistory = await getHistory(sessionId);
    await addHistory(sessionId, 'user', cleanText);

    const mode = await getMode(sessionId);

    if (mode === 'manual') {
      await sendOwnerCard({ sessionId, userText: cleanText, aiReply: null, mode: 'manual' });
      return res.status(200).json({
        reply: 'Сообщение передано владельцу. Он ответит здесь.',
        mode: 'manual'
      });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `Ты — консультант студии аквариумного дизайна Scaper's House.
Отвечай только по-русски.
Пиши кратко, профессионально и по делу. Без Markdown — никаких звёздочек, решёток, тире-списков. Только обычный текст.
Помогай по темам: запуск аквариума, травники, фильтрация, свет, CO2, грунты, растения, обслуживание.
Если данных мало, сначала задай 1–3 уточняющих вопроса.
Если клиент хочет заказать услугу, мягко попроси объем, размеры, фото места установки и бюджет.
Не выдумывай цены и характеристики, если их не дали.`
          },
          ...previousHistory.slice(-10).map(h => ({ role: h.role, content: h.content })),
          {
            role: 'user',
            content: cleanText
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Perplexity error:', response.status, errText);
      return res.status(500).json({ error: 'AI request failed' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'Не удалось получить ответ.';

    await addHistory(sessionId, 'assistant', reply);
    await sendOwnerCard({ sessionId, userText: cleanText, aiReply: reply, mode: 'ai' });

    return res.status(200).json({ reply, mode: 'ai' });
  } catch (error) {
    console.error('CHAT ERROR:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
