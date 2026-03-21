export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
Ты помогаешь с запуском аквариума, подбором фильтра, света, CO2, грунта, растений, оформления и обслуживания.
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

    if (!response.ok) {
      const errText = await response.text();
      console.error('Perplexity error:', response.status, errText);
      return res.status(500).json({ error: 'AI request failed' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'Не удалось получить ответ.';

    return res.status(200).json({ reply, mode: 'ai' });
  } catch (error) {
    console.error('CHAT ERROR:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
