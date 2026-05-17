import ExcelJS from 'exceljs'
import { supabase } from '~/server/utils/supabase'
import { requireAdmin } from '~/server/utils/admin-auth.js'

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

// ─── Эталонное дерево категорий (по скрину заказчика) ───
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
  'Инструменты': 'Инструменты для обслуживания',
  'Системы СО₂': 'Системы CO2',
  'Аэрация и подача СО₂': 'Аэрация и подача CO2'
}

// Предвычисляем все пути эталонного дерева
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

async function ensureCategories(path) {
  let parentId = null
  let currentId = null
  for (let i = 0; i < path.length; i++) {
    const name = path[i]
    const level = i + 1
    const slug = slugify(name)
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .eq('parent_id', parentId)
      .maybeSingle()

    if (existing) {
      currentId = existing.id
    } else {
      const { data: created, error } = await supabase
        .from('categories')
        .insert({ name, slug, parent_id: parentId, level })
        .select('id')
        .single()
      if (error) throw new Error(`Ошибка создания категории ${name}: ${error.message}`)
      currentId = created.id
    }
    parentId = currentId
  }
  return currentId
}

// ─── Обработка справочника 555.xlsx ───
async function processReference(rows) {
  const errors = []
  let created = 0
  let updated = 0
  let skipped = 0
  let prevPath = []
  let lastHeader = null

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const b = row[1]
    const c = row[2]
    const d = row[3]
    const e = row[4]

    if (!b && !c) {
      lastHeader = null
      continue
    }

    // Заголовок группы
    if (b && !c && !d && !e) {
      lastHeader = String(b).trim()
      continue
    }

    // Товар
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

      if (path.some(p => /^морск/i.test(p))) {
        skipped++
        continue
      }

      const categoryId = await ensureCategories(path)
      const slug = slugify(article)
      const productData = {
        article,
        name,
        slug: slug || `p-${Date.now()}`,
        category_id: categoryId,
        price,
        is_available: qty > 0
      }

      const { data: existing } = await supabase.from('products').select('id').eq('article', article).maybeSingle()
      if (existing) {
        const { error } = await supabase.from('products').update(productData).eq('id', existing.id)
        if (error) errors.push(`Строка ${i + 1}: ${error.message}`)
        else updated++
      } else {
        const { error } = await supabase.from('products').insert(productData)
        if (error) errors.push(`Строка ${i + 1}: ${error.message}`)
        else created++
      }
    }
  }

  return { processed: rows.length, created, updated, errors, skipped }
}

// ─── Обработка выгрузки 1С 333.xlsx ───
async function process1C(rows) {
  const errors = []
  let created = 0
  let updated = 0
  let skipped = 0

  let headerIdx = rows.findIndex(r =>
    r.some(c => String(c || '').toLowerCase().includes('артикул')) &&
    r.some(c => String(c || '').toLowerCase().includes('входит в группу'))
  )
  if (headerIdx === -1) {
    throw createError({ statusCode: 400, message: 'Не найдены заголовки 1С (Артикул / Входит в группу)' })
  }

  const dataRows = rows.slice(headerIdx + 1)

  const parentSet = new Set()
  for (const row of dataRows) {
    const parent = row[6]
    if (parent) parentSet.add(String(parent).trim())
  }

  // Категория "НОВИНКИ"
  const novinkiSlug = slugify('НОВИНКИ')
  let novinkiId = null
  const { data: novCat } = await supabase.from('categories').select('id').eq('slug', novinkiSlug).maybeSingle()
  if (novCat) {
    novinkiId = novCat.id
  } else {
    const { data: nc } = await supabase.from('categories').insert({ name: 'НОВИНКИ', slug: novinkiSlug, level: 1 }).select('id').single()
    novinkiId = nc.id
  }

  // Загружаем все товары из Supabase одним запросом
  const { data: allProducts } = await supabase.from('products').select('id, name, article')
  const productByName = {}
  for (const p of allProducts || []) {
    productByName[p.name] = p
  }

  let newCounter = 1
  const updates = []
  const inserts = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const article = row[0] ? String(row[0]).trim() : null
    const name = row[2] ? String(row[2]).trim() : null
    const parent = row[6] ? String(row[6]).trim() : null
    const price = parseFloat(String(row[7] || '0').replace(/\s/g, '').replace(',', '.')) || 0
    const qty = parseFloat(String(row[8] || '0').replace(/\s/g, '').replace(',', '.')) || 0

    if (!name) continue

    if (parent && /^морск/i.test(parent)) {
      skipped++
      continue
    }

    if (parentSet.has(name) || name === 'Аквариумистика / Террариумистика') {
      skipped++
      continue
    }
    if (/^(Валентина|Дубовик|ИП Гончаров)/.test(name)) {
      skipped++
      continue
    }
    if (name === 'Растение в ассортитменте') {
      skipped++
      continue
    }

    const existing = productByName[name]
    if (existing) {
      updates.push({ id: existing.id, price, is_available: qty > 0 })
    } else {
      const newArticle = article || `NEW-${String(newCounter).padStart(3, '0')}`
      newCounter++
      inserts.push({
        article: newArticle,
        name,
        slug: slugify(name) || `p-${Date.now()}-${i}`,
        category_id: novinkiId,
        price,
        is_available: qty > 0,
        is_new: true
      })
    }
  }

  // Batch update
  const UBATCH = 100
  for (let i = 0; i < updates.length; i += UBATCH) {
    const batch = updates.slice(i, i + UBATCH)
    const promises = batch.map(u =>
      supabase.from('products').update({ price: u.price, is_available: u.is_available }).eq('id', u.id)
    )
    const results = await Promise.all(promises)
    let errs = 0
    for (const r of results) {
      if (r.error) errs++
    }
    updated += batch.length - errs
  }

  // Batch insert
  const IBATCH = 50
  for (let i = 0; i < inserts.length; i += IBATCH) {
    const batch = inserts.slice(i, i + IBATCH)
    const { error } = await supabase.from('products').insert(batch)
    if (error) {
      errors.push(`Batch ${i}: ${error.message}`)
    } else {
      created += batch.length
    }
  }

  return { processed: dataRows.length, created, updated, errors, skipped }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'Нет файла' })
  }

  const file = formData.find(f => f.name === 'file')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'Файл не найден' })
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(Buffer.from(file.data))
  const worksheet = workbook.worksheets[0]

  if (!worksheet || worksheet.rowCount < 2) {
    throw createError({ statusCode: 400, message: 'Файл пустой или нет данных' })
  }

  const rows = []
  worksheet.eachRow((row) => {
    rows.push(row.values.slice(1))
  })

  // Определяем формат
  const is1C = rows.some(r =>
    r.some(c => String(c || '').toLowerCase().includes('входит в группу'))
  )

  let result
  if (is1C) {
    result = await process1C(rows)
  } else {
    result = await processReference(rows)
  }

  await supabase.from('import_logs').insert({
    filename: file.filename || 'unknown.xlsx',
    rows_processed: result.processed,
    rows_created: result.created,
    rows_updated: result.updated,
    errors: result.errors.length ? result.errors.join('\n') : null
  })

  return {
    processed: result.processed,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped || 0,
    errors: result.errors.length ? result.errors.slice(0, 20) : []
  }
})
