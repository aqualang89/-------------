import {
  addHistory,
  queueManualReplyForSite,
  setMode
} from '../lib/store.js';

function parseReplyCommand(text = '') {
  const match = text.match(/^\/reply\s+([^\s]+)\s+([\s\S]+)/);
  if (!match) return null;
  return { sessionId: match[1], replyText: match[2].trim() };
}

function parseModeCommand(text = '', command) {
  const match = text.match(new RegExp(`^\\/${command}\\s+([^\\s]+)`));
  return match ? match[1] : null;
}

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

async function askAI(text) {
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
Помогай по темам: запуск аквариума, фильтрация, свет, CO2, грунты, растения и обслуживание.
Если данных мало, сначала задай 1–3 уточняющих вопроса.`
        },
        {
          role: 'user',
          content: text
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Perplexity error:', response.status, errText);
    return 'Сейчас не могу ответить. Попробуйте чуть позже.';
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || 'Не удалось получить ответ.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  if (process.env.TELEGRAM_SECRET) {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== process.env.TELEGRAM_SECRET) {
      return res.status(401).end('Unauthorized');
    }
  }

  try {
    const update = req.body;
    const msg = update?.message;
    const chatId = String(msg?.chat?.id || '');
    const text = (msg?.text || '').trim();

    if (!chatId || !text) {
      return res.status(200).json({ ok: true });
    }

    const isOwner =
      process.env.OWNER_CHAT_ID &&
      chatId === String(process.env.OWNER_CHAT_ID);

    if (isOwner && text === '/start') {
      await sendTelegram(
        chatId,
        'Команды:\n' +
          '/take SESSION_ID — ручной режим\n' +
          '/ai SESSION_ID — вернуть ИИ\n' +
          '/reply SESSION_ID текст — ответить в чат сайта'
      );
      return res.status(200).json({ ok: true });
    }

    if (isOwner) {
      const takeId = parseModeCommand(text, 'take');
      if (takeId) {
        await setMode(takeId, 'manual');
        await sendTelegram(chatId, `✍️ Ручной режим включен для ${takeId}`);
        return res.status(200).json({ ok: true });
      }

      const aiId = parseModeCommand(text, 'ai');
      if (aiId) {
        await setMode(aiId, 'ai');
        await sendTelegram(chatId, `🤖 AI-режим включен для ${aiId}`);
        return res.status(200).json({ ok: true });
      }

      const replyCmd = parseReplyCommand(text);
      if (replyCmd) {
        await addHistory(replyCmd.sessionId, 'assistant', replyCmd.replyText);
        await queueManualReplyForSite(replyCmd.sessionId, replyCmd.replyText);
        await sendTelegram(chatId, `✅ Ответ отправлен на сайт для ${replyCmd.sessionId}`);
        return res.status(200).json({ ok: true });
      }
    }

    const reply = text === '/start'
      ? 'Привет! Напишите вопрос по аквариуму.'
      : await askAI(text);

    await sendTelegram(chatId, reply);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('TELEGRAM ERROR:', error);
    return res.status(500).json({ ok: false });
  }
}
