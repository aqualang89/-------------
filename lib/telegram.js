async function tg(method, payload) {
          const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Telegram ${method} error ${response.status}: ${text}`);
          }

          return response.json();
        }

        export async function sendOwnerCard({ sessionId, userText, aiReply, mode }) {
          if (!process.env.OWNER_CHAT_ID) return;

          const text =
            `💬 Новый диалог
` +
            `ID: ${sessionId}
` +
            `Режим: ${mode}

` +
            `Клиент:
${userText}

` +
            `ИИ:
${aiReply || '—'}`;

          return tg('sendMessage', {
            chat_id: process.env.OWNER_CHAT_ID,
            text,
            reply_markup: {
              inline_keyboard: [[
                { text: '✍️ Отвечаю сам', callback_data: `take:${sessionId}` },
                { text: '🤖 Вернуть ИИ', callback_data: `ai:${sessionId}` }
              ]]
            }
          });
        }

        export async function sendOwnerText(text) {
          if (!process.env.OWNER_CHAT_ID) return;
          return tg('sendMessage', { chat_id: process.env.OWNER_CHAT_ID, text });
        }

        export async function answerCallbackQuery(callbackQueryId, text = 'OK') {
          return tg('answerCallbackQuery', {
            callback_query_id: callbackQueryId,
            text
          });
        }

        export async function removeInlineKeyboard(chatId, messageId) {
          return tg('editMessageReplyMarkup', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: [] }
          });
        }
