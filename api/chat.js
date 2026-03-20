// pages/api/chat.js
export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  try {
    const aiResp = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'Аквариумный консультант. Отвечай коротко, по‑русски.' },
          ...messages,
        ],
      }),
    });

    const data = await aiResp.json();
    const answer = data.choices?.[0]?.message?.content ?? 'Не удалось получить ответ';

    res.status(200).json({ reply: answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
