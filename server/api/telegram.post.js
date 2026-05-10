import {
  addHistory,
  queueManualReplyForSite,
  setMode
} from '~/server/utils/store.js';
import { askOpenRouter, findRelevantProducts } from '~/server/utils/ai.js';

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

async function askTelegramAI(text) {
  const products = await findRelevantProducts(text)
  const catalogContext = products.length
    ? '\n\nДоступные товары из каталога:\n' +
      products.map(p =>
        `— ${p.name} (арт. ${p.article || 'нет'}) — ${Math.round(p.price).toLocaleString()} ₽`
      ).join('\n')
    : ''

  const messages = [
    {
      role: 'system',
      content: `Ты — консультант магазина Рипарий (Калининград, ул. Аксакова, 123). Ты продаёшь аквариумы, оборудование, растения, рыб и всё для аквариумистики.

Отвечай только по-русски. Пиши кратко, живо, как продавец в магазине. Без канцелярита.
— Всегда предлагай 1-3 конкретных товара из списка ниже с ценой и артикулом.
— Если точного товара нет — предложи ближайшую альтернативу из списка.
— Не выдумывай товары, которых нет в списке.
— Если клиент просто спрашивает совет — ответь по делу, но в конце предложи подходящий товар из каталога.
${catalogContext}`
    },
    { role: 'user', content: text }
  ]

  try {
    return await askOpenRouter(messages)
  } catch (e) {
    console.error('Telegram AI error:', e)
    return 'Сейчас не могу ответить. Попробуйте чуть позже.'
  }
}

export default defineEventHandler(async (event) => {
  if (process.env.TELEGRAM_SECRET) {
    const secret = getHeader(event, 'x-telegram-bot-api-secret-token');
    if (secret !== process.env.TELEGRAM_SECRET) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
  }

  const body = await readBody(event);
  const msg = body?.message;
  const chatId = String(msg?.chat?.id || '');
  const text = (msg?.text || '').trim();

  if (!chatId || !text) {
    return { ok: true };
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
    return { ok: true };
  }

  if (isOwner) {
    const takeId = parseModeCommand(text, 'take');
    if (takeId) {
      await setMode(takeId, 'manual');
      await sendTelegram(chatId, `✍️ Ручной режим включен для ${takeId}`);
      return { ok: true };
    }

    const aiId = parseModeCommand(text, 'ai');
    if (aiId) {
      await setMode(aiId, 'ai');
      await sendTelegram(chatId, `🤖 AI-режим включен для ${aiId}`);
      return { ok: true };
    }

    const replyCmd = parseReplyCommand(text);
    if (replyCmd) {
      await addHistory(replyCmd.sessionId, 'assistant', replyCmd.replyText);
      await queueManualReplyForSite(replyCmd.sessionId, replyCmd.replyText);
      await sendTelegram(chatId, `✅ Ответ отправлен на сайт для ${replyCmd.sessionId}`);
      return { ok: true };
    }
  }

  const reply = text === '/start'
    ? 'Привет! Напишите вопрос по аквариуму.'
    : await askTelegramAI(text);

  await sendTelegram(chatId, reply);

  return { ok: true };
});
