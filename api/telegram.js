import { setMode, queueManualReplyForSite } from '../lib/store.js';
import {
  answerCallbackQuery,
  removeInlineKeyboard,
  sendOwnerText
} from '../lib/telegram.js';

function parseReplyCommand(text = '') {
  const match = text.match(/^\/reply\s+([^\s]+)\s+([\s\S]+)/);
  if (!match) return null;
  return { sessionId: match[1], replyText: match[2].trim() };
}

function parseModeCommand(text = '', command) {
  const match = text.match(new RegExp(`^\\/${command}\\s+([^\\s]+)`));
  return match ? match[1] : null;
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

    if (update.callback_query) {
      const q = update.callback_query;
      const data = q.data || '';
      const [action, sessionId] = data.split(':');

      if (action === 'take') {
        await setMode(sessionId, 'manual');
        await answerCallbackQuery(q.id, 'Чат переведен в ручной режим');
        await removeInlineKeyboard(q.message.chat.id, q.message.message_id);
        await sendOwnerText(
          `✍️ Ручной режим включен для ${sessionId}\nОтвет: /reply ${sessionId} ваш текст`
        );
        return res.status(200).json({ ok: true });
      }

      if (action === 'ai') {
        await setMode(sessionId, 'ai');
        await answerCallbackQuery(q.id, 'ИИ снова отвечает сам');
        await removeInlineKeyboard(q.message.chat.id, q.message.message_id);
        await sendOwnerText(`🤖 AI-режим включен для ${sessionId}`);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    const msg = update.message;
    const chatId = String(msg?.chat?.id || '');
    const text = (msg?.text || '').trim();

    if (!msg || !text) {
      return res.status(200).json({ ok: true });
    }

    if (process.env.OWNER_CHAT_ID && chatId !== String(process.env.OWNER_CHAT_ID)) {
      return res.status(200).json({ ok: true });
    }

    if (text === '/start') {
      await sendOwnerText(
        'Команды:\n' +
        '/take SESSION_ID — перевести чат в ручной режим\n' +
        '/ai SESSION_ID — вернуть ИИ\n' +
        '/reply SESSION_ID текст — отправить ручной ответ клиенту'
      );
      return res.status(200).json({ ok: true });
    }

    const takeId = parseModeCommand(text, 'take');
    if (takeId) {
      await setMode(takeId, 'manual');
      await sendOwnerText(`✍️ Ручной режим включен для ${takeId}`);
      return res.status(200).json({ ok: true });
    }

    const aiId = parseModeCommand(text, 'ai');
    if (aiId) {
      await setMode(aiId, 'ai');
      await sendOwnerText(`🤖 AI-режим включен для ${aiId}`);
      return res.status(200).json({ ok: true });
    }

    const replyCmd = parseReplyCommand(text);
    if (replyCmd) {
      await queueManualReplyForSite(replyCmd.sessionId, replyCmd.replyText);
      await sendOwnerText(`✅ Ответ отправлен в чат сайта для ${replyCmd.sessionId}`);
      return res.status(200).json({ ok: true });
    }

    await sendOwnerText('Не понял команду. Используйте /reply SESSION_ID текст');
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('TELEGRAM ERROR', error);
    return res.status(500).json({ ok: false });
  }
}
