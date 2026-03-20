export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'No API key' });
  }

  // Системный промпт
  const systemMessage = {
    role: 'system',
    content: 'Ты эксперт по аквариумам. Короткие ответы по-русски, на "вы".'
  };

  const finalMessages = [systemMessage, ...messages];

  try {
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
        max_tokens: 300
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Perplexity error:', data);
      return res.status(500).json({ error: 'AI error' });
    }

    const answer = data.choices[0]?.message?.content || 'Нет ответа';
    res.status(200).json({ reply: answer });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}