import ExcelJS from 'exceljs'
import { supabase } from '~/server/utils/supabase'

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

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, message: 'Неверный пароль' })
  }

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

  // Определяем колонки по заголовкам (первая строка)
  const headers = rows[0].map(h => String(h).toLowerCase().trim())
  const idx = {
    article: headers.findIndex(h => h.includes('артикул') || h.includes('article') || h.includes('код')),
    name: headers.findIndex(h => h.includes('название') || h.includes('наименование') || h.includes('name') || h.includes('товар')),
    price: headers.findIndex(h => h.includes('цена') || h.includes('price') || h.includes('стоимость')),
    category: headers.findIndex(h => h.includes('категория') || h.includes('category') || h.includes('группа')),
    oldPrice: headers.findIndex(h => h.includes('старая цена') || h.includes('old price') || h.includes('розница')),
    available: headers.findIndex(h => h.includes('остаток') || h.includes('наличие') || h.includes('available') || h.includes('количество'))
  }

  if (idx.article === -1 || idx.name === -1) {
    throw createError({ statusCode: 400, message: 'Не найдены обязательные колонки: артикул и название' })
  }

  const dataRows = rows.slice(1).filter(r => r[idx.article] || r[idx.name])
  const errors = []
  let created = 0
  let updated = 0

  // Получаем существующие категории
  const { data: existingCats } = await supabase.from('categories').select('id, name')
  const catMap = new Map((existingCats || []).map(c => [c.name.toLowerCase().trim(), c.id]))

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const article = String(row[idx.article] || '').trim()
    const name = String(row[idx.name] || '').trim()
    const price = parseFloat(String(row[idx.price] || '0').replace(/\s/g, '').replace(',', '.')) || 0
    const categoryName = idx.category !== -1 ? String(row[idx.category] || '').trim() : ''
    const oldPrice = idx.oldPrice !== -1 ? parseFloat(String(row[idx.oldPrice] || '').replace(/\s/g, '').replace(',', '.')) || null : null
    const availableQty = idx.available !== -1 ? parseFloat(String(row[idx.available] || '0').replace(/\s/g, '').replace(',', '.')) : 1

    if (!article || !name) continue

    let categoryId = null
    if (categoryName) {
      const key = categoryName.toLowerCase()
      if (catMap.has(key)) {
        categoryId = catMap.get(key)
      } else {
        const slug = slugify(categoryName) || `cat-${Date.now()}`
        const { data: newCat, error: catErr } = await supabase
          .from('categories')
          .insert({ name: categoryName, slug })
          .select('id')
          .single()
        if (!catErr && newCat) {
          categoryId = newCat.id
          catMap.set(key, categoryId)
        }
      }
    }

    const slug = article ? slugify(article) : slugify(name)
    const productData = {
      article,
      name,
      slug: slug || `p-${Date.now()}`,
      category_id: categoryId,
      price,
      old_price: oldPrice,
      is_available: availableQty > 0
    }

    // Upsert по артикулу
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('article', article)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase.from('products').update(productData).eq('id', existing.id)
      if (error) errors.push(`Строка ${i + 2}: ${error.message}`)
      else updated++
    } else {
      const { error } = await supabase.from('products').insert(productData)
      if (error) errors.push(`Строка ${i + 2}: ${error.message}`)
      else created++
    }
  }

  // Лог
  await supabase.from('import_logs').insert({
    filename: file.filename || 'unknown.xlsx',
    rows_processed: dataRows.length,
    rows_created: created,
    rows_updated: updated,
    errors: errors.length ? errors.join('\n') : null
  })

  return {
    processed: dataRows.length,
    created,
    updated,
    errors: errors.length ? errors.slice(0, 20) : []
  }
})
