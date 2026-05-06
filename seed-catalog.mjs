import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import xlsx from 'xlsx'

// Загружаем .env вручную
const envContent = fs.readFileSync('.env', 'utf-8')
envContent.split('\n').forEach(line => {
  const eq = line.indexOf('=')
  if (eq > 0 && !line.trim().startsWith('#')) {
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    process.env[key] = val
  }
})

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
if (!url || !key) {
  console.error('Нужны SUPABASE_URL и SUPABASE_SERVICE_KEY в .env')
  process.exit(1)
}

const agent = new HttpsProxyAgent('http://FOHVRM3A:GYADGLVN@31.57.204.165:45324')
const supabase = createClient(url, key, {
  global: {
    fetch: (url, opts) => fetch(url, { ...opts, agent })
  }
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
      {
        name: 'Освещение',
        children: [{ name: 'Светильники' }, { name: 'Аксессуары' }]
      },
      {
        name: 'Фильтрация',
        children: [
          {
            name: 'Фильтры',
            children: [
              { name: 'Внутренние' },
              { name: 'Рюкзачного типа' },
              { name: 'Скиммеры' },
              { name: 'Внешние' }
            ]
          },
          { name: 'Наполнители для фильтра' },
          { name: 'Аксессуары' }
        ]
      },
      {
        name: 'Помпы',
        children: [{ name: 'Помпы подъемные' }, { name: 'Помпы течения' }]
      },
      {
        name: 'Аэрация и подача CO2',
        children: [{ name: 'Компрессоры' }, { name: 'Системы CO2' }, { name: 'Аксессуары' }]
      },
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
      {
        name: 'Водоподготовка',
        children: [{ name: 'Кондиционеры' }, { name: 'Минерализация' }]
      },
      { name: 'Удобрения' },
      { name: 'Борьба с водорослями' },
      { name: 'Аптечка и борьба с вредителями' },
      { name: 'Средства для запуска' }
    ]
  },
  { name: 'Тесты и измерительное оборудование' },
  { name: 'Корма' },
  { name: 'Инструменты для обслуживания' },
  {
    name: 'Декор',
    children: [{ name: 'Камни' }, { name: 'Коряги' }, { name: 'Керамические укрытия' }]
  },
  {
    name: 'Грунты',
    children: [{ name: 'Питательные' }, { name: 'Декоративные' }]
  },
  {
    name: 'Растения',
    children: [
      {
        name: 'На питательной основе',
        children: [{ name: 'Длинностебельные' }, { name: 'Почвопокровные' }]
      },
      {
        name: 'Без питательной основы',
        children: [
          { name: 'Длинностебельные' },
          { name: 'Кустовые' },
          { name: 'Почвопокровные' },
          { name: 'Ароидные' },
          { name: 'Мхи' },
          { name: 'Палюдариумные' },
          { name: 'Водоросли' }
        ]
      }
    ]
  },
  {
    name: 'Животные',
    children: [
      { name: 'Рыба' },
      { name: 'Ракообразные' },
      { name: 'Моллюски' },
      { name: 'Амфибии' }
    ]
  },
  { name: 'Морская аквариумистика' },
  { name: 'Разное' }
]

const NAME_MAP = {
  'Внутренние фильтры': 'Внутренние',
  'Фильтры рюкзачного типа': 'Рюкзачного типа',
  'Внешние фильтры': 'Внешние',
  'Керамика': 'Керамические укрытия',
  'Инструменты': 'Инструменты для обслуживания'
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
    }
  }
  return best
}

// Кэш категорий в памяти
const catCache = new Map()

async function ensureCategories(path) {
  let parentId = null
  let currentId = null
  for (let i = 0; i < path.length; i++) {
    const name = path[i]
    const level = i + 1
    const slug = slugify(name)
    const cacheKey = `${slug}:${parentId}`

    if (catCache.has(cacheKey)) {
      currentId = catCache.get(cacheKey)
    } else {
      const { data: created, error } = await supabase
        .from('categories')
        .insert({ name, slug, parent_id: parentId, level })
        .select('id')
        .single()
      if (error && error.code === '23505') {
        // Unique violation — уже существует
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', slug)
          .eq('parent_id', parentId)
          .single()
        currentId = existing.id
      } else if (error) {
        throw new Error(`Ошибка создания категории ${name}: ${error.message}`)
      } else {
        currentId = created.id
      }
      catCache.set(cacheKey, currentId)
    }
    parentId = currentId
  }
  return currentId
}

async function main() {
  const { data: cols, error: colsErr } = await supabase
    .from('categories')
    .select('parent_id')
    .limit(1)
  if (colsErr && colsErr.message.includes('parent_id')) {
    console.error('❌ Колонка parent_id не найдена. Сначала выполни миграцию SQL.')
    process.exit(1)
  }
  if (colsErr) {
    console.error('❌ Ошибка подключения к Supabase:', colsErr.message)
    process.exit(1)
  }

  console.log('📖 Читаем 555-with-articles.xlsx...')
  const wb = xlsx.readFile('C:\\Users\\Татьяна\\Pictures\\555-with-articles.xlsx')
  const data = xlsx.utils.sheet_to_json(wb.Sheets['Лист1'], { header: 1 })

  const items = []
  let prevPath = []
  let lastHeader = null

  console.log('🌳 Парсим товары...')
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const b = row[1]
    const c = row[2]
    const d = row[3]
    const e = row[4]

    if (!b && !c) {
      lastHeader = null
      continue
    }

    if (b && !c && !d && !e) {
      lastHeader = String(b).trim()
      continue
    }

    if (c) {
      const article = b ? String(b).trim() : null
      const name = String(c).trim()
      const price = parseFloat(String(d || '0').replace(/\s/g, '').replace(',', '.')) || 0
      const qty = parseFloat(String(e || '0').replace(/\s/g, '').replace(',', '.')) || 0

      if (!article || !name) continue

      let path
      if (lastHeader) {
        path = findBestPath(lastHeader, prevPath)
        prevPath = path
        lastHeader = null
      } else {
        path = prevPath
      }

      items.push({ article, name, price, qty, path })
    }
  }

  console.log(`🌳 Создаём категории (${items.length} товаров)...`)
  for (const item of items) {
    item.category_id = await ensureCategories(item.path)
  }

  // Batch upsert по 100 штук
  const BATCH = 100
  let created = 0
  let updated = 0

  console.log('💾 Заливаем товары batch-ами...')
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map(it => ({
      article: it.article,
      name: it.name,
      slug: slugify(it.article) || `p-${Date.now()}-${i}`,
      category_id: it.category_id,
      price: it.price,
      is_available: it.qty > 0
    }))

    const { data: upserted, error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'article' })
      .select('id')

    if (error) {
      console.error(`❌ Ошибка batch ${i}-${i + batch.length}:`, error.message)
    } else {
      // upsert не говорит created/updated, считаем все как upserted
      created += upserted.length
    }

    if (i % 200 === 0) {
      console.log(`  ... обработано ${Math.min(i + BATCH, items.length)} / ${items.length}`)
    }
  }

  console.log(`✅ Готово! Обработано: ${items.length}, batch-upsert: ${created}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
