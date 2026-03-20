export default async function handler(req, res) {
  console.log('API START');
  
  if (req.method !== 'POST') {
    console.log('NOT POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const { messages } = req.body;
  console.log('MESSAGES:', messages?.length);

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages required' });
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  const finalMessages = [{
    role: 'system',
    content: 'Аквариумный консультант. Коротко, по-русски.'
  }, ...messages];

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
    const answer = data.choices?.[0]?.message?.content || 'AI error';

    console.log('AI ANSWER OK');
    res.json({ reply: answer });

  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
