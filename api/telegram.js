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
    const chatId = msg?.chat?.id;
    const text = (msg?.text || '').trim();

    if (!chatId || !text) {
      return res.status(200).json({ ok: true });
    }

    let reply = '';

    if (text === '/start') {
      reply =
        'Привет! Я бот Scaper’s House. Напишите вопрос по аквариуму: запуск, фильтр, свет, CO2, грунт, растения или обслуживание.';
    } else {
      const aiRes = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: `Ты — консультант студии аквариумного дизайна Scaper’s House.
Отвечай только по-русски.
Пиши кратко, профессионально и по делу.
Помогай по темам: запуск аквариума, травники, фильтрация, свет, CO2, грунты, растения, обслуживание.
Если данных мало, сначала задай 1–3 уточняющих вопроса.
Если клиент хочет заказать услугу, мягко попроси объем, размеры, фото места установки и бюджет.
Не выдумывай цены и характеристики, если их не дали.`
            },
            {
              role: 'user',
              content: text
            }
          ]
        })
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error('Perplexity error:', aiRes.status, errText);
        reply = 'Сейчас не могу ответить. Попробуйте чуть позже.';
      } else {
        const data = await aiRes.json();
        reply =
          data?.choices?.[0]?.message?.content ||
          'Не удалось получить ответ.';
      }
    }

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply
        })
      }
    );

    if (!tgRes.ok) {
      const tgErr = await tgRes.text();
      console.error('Telegram sendMessage error:', tgRes.status, tgErr);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('TELEGRAM ERROR:', error);
    return res.status(500).json({ ok: false });
  }
}
