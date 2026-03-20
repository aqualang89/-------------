export default async function handler(req, res) {
  console.log('🧪 CHAT.JS РАБОТАЕТ!', req.body);
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  
  res.status(200).json({ 
    reply: '🧪 ТЕСТ: API работает! Telegram готов.' 
  });
}
