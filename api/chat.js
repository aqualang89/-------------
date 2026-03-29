import {
  addHistory,
  getMode
} from '../lib/store.js';

async function sendTelegram(text) {
  if (!process.env.OWNER_CHAT_ID || !process.env.TELEGRAM_BOT_TOKEN) return;

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.OWNER_CHAT_ID,
      text
    })
  });
}

async function notifyOwnerAboutClient(sessionId, text) {
  const ownerText =
    `🌐 Сообщение с сайта\n` +
    `SESSION_ID: ${sessionId}\n\n` +
    `Клиент: ${text}\n\n` +
    `/take ${sessionId}\n` +
    `/reply ${sessionId} ваш ответ\n` +
    `/ai ${sessionId}`;

  await sendTelegram(ownerText);
}

async function notifyOwnerAboutAiReply(sessionId, userText, reply) {
  const ownerText =
    `🤖 ИИ ответил на сайте\n` +
    `SESSION_ID: ${sessionId}\n\n` +
    `Клиент: ${userText}\n\n` +
    `Ответ ИИ:\n${reply}\n\n` +
    `/take ${sessionId}\n` +
    `/reply ${sessionId} ваш ответ\n` +
    `/ai ${sessionId}`;

  await sendTelegram(ownerText);
}

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

    await addHistory(sessionId, 'user', cleanText);
    await notifyOwnerAboutClient(sessionId, cleanText);

    const mode = await getMode(sessionId);

    if (mode === 'manual') {
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
Пиши кратко, профессионально и по делу.
Помогай по темам: запуск аквариума, травники, фильтрация, свет, CO2, грунты, растения, обслуживание.
Если данных мало, сначала задай 1–3 уточняющих вопроса.
Если клиент хочет заказать услугу, мягко попроси объем, размеры, фото места установки и бюджет.
Не выдумывай цены и характеристики, если их не дали.`
          },
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
    await notifyOwnerAboutAiReply(sessionId, cleanText, reply);

    return res.status(200).json({ reply, mode: 'ai' });
  } catch (error) {
    console.error('CHAT ERROR:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
