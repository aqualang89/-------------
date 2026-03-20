// api/chat.js
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

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages required' });
    return;
  }

  // добавляем системный промпт про аквариумы
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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',  // уже должно работать
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
    const answer =
      data.choices?.[0]?.message?.content ||
      'Не удалось получить ответ. Попробуйте ещё раз.';

    res.status(200).json({ reply: answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}
// Уведомляем владельца в Telegram
try {
  await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''}/api/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: text,
      aiAnswer: answer,
      clientId: Date.now()
    })
  });
} catch (e) {
  console.log('Telegram notify failed:', e);
}
