import Excel from 'exceljs'
import { createClient } from '@supabase/supabase-js'
import { HttpsProxyAgent } from 'https-proxy-agent'

const PROXY = 'http://FOHVRM3A:GYADGLVN@31.57.204.165:45324'
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vbopaqxxhumyauwpqgbs.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

const agent = new HttpsProxyAgent(PROXY)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { fetch: (url, opts) => fetch(url, { ...opts, agent }) }
})

function slugify(str) {
  if (!str) return ''
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya'
  }
  return str
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const REF_TREE = [
  { name: 'Аквариумы и тумбы', children: [{ name: 'Коврики' }] },
  {
    name: 'Оборудование',
    children: [
      { name: 'Освещение', children: [{ name: 'Светильники' }, { name: 'Аксессуары' }] },
      {
        name: 'Фильтрация',
        children: [
          { name: 'Фильтры', children: [{ name: 'Внутренние' }, { name: 'Рюкзачного типа' }, { name: 'Скиммеры' }, { name: 'Внешние' }] },
          { name: 'Наполнители для фильтра' },
          { name: 'Аксессуары' }
        ]
      },
      { name: 'Помпы', children: [{ name: 'Помпы подъемные' }, { name: 'Помпы течения' }] },
      { name: 'Аэрация и подача CO2', children: [{ name: 'Компрессоры' }, { name: 'Системы CO2' }, { name: 'Аксессуары' }] },
      { name: 'Терморегуляция' },
      { name: 'Подача удобрений' },
      { name: 'Стерилизация' },
      { name: 'Кормушки' },
      { name: 'Запасные части' },
      { name: 'Разное' }
    ]
  },
  {
    name: 'Средства для воды',
    children: [
      { name: 'Водоподготовка', children: [{ name: 'Кондиционеры' }, { name: 'Минерализация' }] },
      { name: 'Удобрения' },
      { name: 'Борьба с водорослями' },
      { name: 'Аптечка и борьба с вредителями' },
      { name: 'Средства для запуска' }
    ]
  },
  { name: 'Тесты и измерительное оборудование' },
  { name: 'Корма' },
  { name: 'Инструменты для обслуживания' },
  { name: 'Декор', children: [{ name: 'Камни' }, { name: 'Коряги' }, { name: 'Керамические укрытия' }] },
  { name: 'Грунты', children: [{ name: 'Питательные' }, { name: 'Декоративные' }] },
  {
    name: 'Растения',
    children: [
      { name: 'На питательной основе', children: [{ name: 'Длинностебельные' }, { name: 'Почвопокровные' }] },
      {
        name: 'Без питательной основы',
        children: [{ name: 'Длинностебельные' }, { name: 'Кустовые' }, { name: 'Почвопокровные' }, { name: 'Ароидные' }, { name: 'Мхи' }, { name: 'Палюдариумные' }, { name: 'Водоросли' }]
      }
    ]
  },
  { name: 'Животные', children: [{ name: 'Рыба' }, { name: 'Ракообразные' }, { name: 'Моллюски' }, { name: 'Амфибии' }] },
  { name: 'Морская аквариумистика' },
  { name: 'Разное' }
]

const NAME_MAP = {
  'Внутренние фильтры': 'Внутренние',
  'Фильтры рюкзачного типа': 'Рюкзачного типа',
  'Внешние фильтры': 'Внешние',
  'Керамика': 'Керамические укрытия',
  'Инструменты': 'Инструменты для обслуживания',
  'Системы СО₂': 'Системы CO2',
  'Аэрация и подача СО₂': 'Аэрация и подача CO2'
}

const ALL_PATHS = []
function collectPaths(node, path = []) {
  const cur = [...path, node.name]
  ALL_PATHS.push(cur)
  if (node.children) {
    for (const child of node.children) collectPaths(child, cur)
  }
}
for (const root of REF_TREE) collectPaths(root)

function findBestPath(leafName, prevPath = []) {
  const mapped = NAME_MAP[leafName] || leafName
  const candidates = ALL_PATHS.filter(p => p[p.length - 1] === mapped)
  if (candidates.length === 0) return [leafName]
  if (candidates.length === 1) return candidates[0]
  let best = candidates[0]
  let bestScore = -1
  for (const cand of candidates) {
    let score = 0
    for (let i = 0; i < Math.min(prevPath.length, cand.length); i++) {
      if (prevPath[i] === cand[i]) score++
    }
    if (score > bestScore) {
      bestScore = score
      best = cand
    } else if (score === bestScore && score === 0) {
      if (cand.length < best.length) {
        best = cand
      }
    }
  }
  return best
}

async function main() {
  console.log('📦 Загружаем категории из Supabase...')
  const { data: allCats, error: catError } = await supabase.from('categories').select('*')
  if (catError) throw catError

  const catMap = {}
  for (const c of allCats) {
    const key = c.name + '|' + (c.parent_id || 'null')
    catMap[key] = c.id
  }

  function getCategoryIdByPath(path) {
    let parentId = 'null'
    let currentId = null
    for (const name of path) {
      const key = name + '|' + parentId
      if (!catMap[key]) return null
      currentId = catMap[key]
      parentId = String(currentId)
    }
    return currentId
  }

  console.log('📖 Читаем 555-with-articles.xlsx...')
  const wb = new Excel.Workbook()
  await wb.xlsx.readFile('C:\\Users\\Татьяна\\Pictures\\555-with-articles.xlsx')
  const ws = wb.getWorksheet(1)

  const items = []
  const seenArticles = new Set()
  let prevPath = []
  let lastHeader = null

  for (let rowNum = 3; rowNum <= ws.rowCount; rowNum++) {
    const row = ws.getRow(rowNum)
    const b = row.getCell(2).value
    const c = row.getCell(3).value
    const d = row.getCell(4).value
    const e = row.getCell(5).value

    if (!b && !c) {
      lastHeader = null
      continue
    }

    if (b && (!c || String(b).trim() === String(c).trim()) && !d && !e) {
      lastHeader = String(b).trim()
      continue
    }

    if (c) {
      const article = b ? String(b).trim() : null
      const name = String(c).trim()
      const price = parseFloat(String(d || '0').replace(/\s/g, '').replace(',', '.')) || 0
      const qty = parseFloat(String(e || '0').replace(/\s/g, '').replace(',', '.')) || 0

      if (!article || !name) continue
      if (seenArticles.has(article)) continue
      seenArticles.add(article)

      let path
      if (lastHeader) {
        path = findBestPath(lastHeader, prevPath)
        prevPath = path
        lastHeader = null
      } else {
        path = prevPath
      }

      if (!path || path.length === 0) continue

      const catId = getCategoryIdByPath(path)
      if (!catId) continue

      items.push({
        article,
        name,
        slug: slugify(article) || `p-${Date.now()}-${items.length}`,
        category_id: catId,
        price,
        is_available: qty > 0
      })
    }
  }

  console.log(`🌳 Найдено ${items.length} товаров, заливаем batch-ами по 100...`)

  const BATCH = 25
  let created = 0
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH)
    let attempts = 0
    let success = false
    while (attempts < 3 && !success) {
      const { data: upserted, error } = await supabase
        .from('products')
        .upsert(batch, { onConflict: 'article' })
        .select('id')

      if (error) {
        attempts++
        console.log(`  ⚠️ Batch ${i}-${i + batch.length} попытка ${attempts}: ${error.message}`)
        await new Promise(r => setTimeout(r, 2000))
      } else {
        created += upserted.length
        success = true
      }
    }
    if (!success) {
      console.error(`❌ Batch ${i}-${i + batch.length} не удался после 3 попыток`)
    }

    if (i % 100 === 0) {
      console.log(`  ... ${Math.min(i + BATCH, items.length)} / ${items.length}`)
    }
  }

  console.log(`✅ Готово! Загружено: ${created} / ${items.length}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
