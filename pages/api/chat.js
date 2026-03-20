module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const { messages } = req.body;
  
  fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{
        role: 'system',
        content: 'Аквариумный эксперт. По-русски, коротко.'
      }, ...messages]
    })
  })
  .then(r => r.json())
  .then(data => {
    const answer = data.choices[0].message.content;
    res.status(200).json({ reply: answer });
  })
  .catch(e => {
    console.error(e);
    res.status(500).json({ error: 'AI error' });
  });
};
