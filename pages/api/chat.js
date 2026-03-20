// api/chat.js – С ДЕБАГОМ (копируй целиком)
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

  // 🧪 ТЕСТ ПЕРЕМЕННЫХ (удали потом)
  console.log('🔑 TOKEN OK:', !!process.env.TELEGRAM_BOT_TOKEN);
  console.log('👤 CHAT_ID:', process.env.TELEGRAM_ADMIN_CHAT_ID);
  console.log('🌐 VERCEL_URL:', process.env.VERCEL_URL);
  console.log('💬 chatId из фронта:', chatId);

  // Системный промпт
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
    // 1. Perplexity
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
    const lastMessage = messages[messages.length - 1]?.content || 'сообщение';

// 2. TELEGRAM НАПРЯМУЮ (без /api/telegram)
console.log('🚀 ОТПРАВЛЯЕМ В TELEGRAM НАПРЯМУЮ');

try {
  const lastMessage = messages[messages.length - 1]?.content || 'сообщение';
  
  const telegramRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
      text: `🐟 *Новый клиент*\n\n❓ *Вопрос*:\n${lastMessage}\n\n🤖 *ИИ ответил*:\n${answer.slice(0,200)}\n\n💬 Ваш ответ:`,
      parse_mode: 'Markdown'
    })
  });
  
  const result = await telegramRes.json();
  console.log('📱 TELEGRAM API:', result.ok ? '✅' : result);
  
} catch (error) {
  console.log('❌ TELEGRAM:', error.message);
}

