// api/chat.js – ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing PERPLEXITY_API_KEY' });
    return;
  }

  const { messages, chatId } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages required' });
    return;
  }

  // Системный промпт про аквариумы
  const finalMessages = [
    {
      role: 'system',
      content:
        'Ты консультант студии аквариумного дизайна. ' +
        'Отвечаешь коротко и по делу, помогаешь подобрать ' +
        'объем, оборудование и обслуживание аквариума. ' +
        'Пиши по-русски, дружелюбно, на "вы".'
    },
    ...messages
  ];

  try {
    // 1. Получаем ответ от Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: finalMessages,
        temperature: 0.3,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Perplexity error:', text);
      res.status(500).json({ error: 'LLM error' });
      return;
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Не удалось получить ответ.';

    // 2. Уведомляем владельца (БЕЗ ОШИБОК)
    try {
      if (process.env.TELEGRAM_BOT_TOKEN && chatId) {
        const lastMessage = messages[messages.length - 1]?.content || 'сообщение';
        
        await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://aquapage-aqua-bot.vercel.app'}/api/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: lastMessage,
            aiAnswer: answer,
            clientChatId: chatId,
            clientId: Date.now()
          })
        });
      }
    } catch (telegramError) {
      console.log('Telegram уведомление: OK, но не критично', telegramError.message);
    }

    // 3. Отвечаем клиенту
    res.status(200).json({ 
      reply: answer,
      chatId: chatId  // для ответов владельца
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
