export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { question, aiAnswer } = req.body;
  
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
      text: `🐟 ${question}\n🤖 ${aiAnswer}`
    })
  });
  
  res.status(200).json({ ok: true });
}
