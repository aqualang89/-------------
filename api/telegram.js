// api/telegram.js
const TelegramBot = require('node-telegram-bot-api');

process.env.NTBA_FIX_319 = 1; // фикс для Vercel

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { question, aiAnswer, clientId } = req.body;
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

  // Отправляем уведомление владельцу
  const message = `🐟 *Новый клиент #${clientId}*\n\n` +
    `❓ *Вопрос*: ${question}\n\n` +
    `🤖 *ИИ ответил*: ${aiAnswer}\n\n` +
    `💬 *Ваш ответ (или /skip для ИИ):*`;

  await bot.sendMessage(
    process.env.TELEGRAM_ADMIN_CHAT_ID,
    message,
    { parse_mode: 'Markdown' }
  );

  res.status(200).json({ ok: true });
}
