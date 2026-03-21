const SYSTEM_PROMPT = `
Ты — консультант студии аквариумного дизайна Scaper’s House.

Правила:
- Отвечай только по-русски.
- Пиши коротко, профессионально и по делу.
- Специализация: аквариумный дизайн, запуск аквариума, травники, фильтрация, свет, CO2, грунты, растения, обслуживание.
- Если не хватает данных, сначала задай 1-3 уточняющих вопроса.
- Если клиент хочет заказать услугу, мягко веди к заявке: спроси объем, размеры, фото места установки и бюджет.
- Не выдумывай конкретные характеристики и цены, если их нет в вопросе.
- Формат: короткий вывод + 2-5 практических пунктов.
`;

export async function askAquariumAI(messages) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Perplexity error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || 'Не удалось получить ответ.';
}
