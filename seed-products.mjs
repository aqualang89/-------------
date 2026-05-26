import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Ключи из локального .env (он в .gitignore) — НЕ хардкодить секреты в коде
const env = {}
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

const categories = [
  { name: 'Аквариумы', slug: 'akvariumy' },
  { name: 'Животные', slug: 'zhivotnye' }
]

const products = [
  { article: 'AQ-001', name: 'Нано-аквариум 30 л', slug: 'nano-akvarium-30l', price: 15000, description: 'Компактный аквариум для стола с живыми растениями.' },
  { article: 'AQ-002', name: 'Премиум креветочник 100 л', slug: 'premium-krevetochnik-100l', price: 45000, description: 'Акваскейп с Riccardia мхом и камнями Elephant Stone.' },
  { article: 'AQ-003', name: 'Офисный аквариум 200 л', slug: 'ofisnyy-akvarium-200l', price: 85000, description: 'Строгий дизайн для приёмной или кабинета.' },
  { article: 'AQ-004', name: 'Креветки Crystal Red (10 шт)', slug: 'krevetki-crystal-red-10sht', price: 2500, description: 'Качественная линия для креветочника.' }
]

async function seed() {
  // Insert categories
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })
    .select()

  if (catErr) {
    console.error('Categories error:', catErr)
    return
  }

  console.log('Categories:', cats.map(c => c.name))

  const catMap = {}
  cats.forEach(c => catMap[c.slug] = c.id)

  const productsWithCats = products.map((p, i) => ({
    ...p,
    category_id: i < 3 ? catMap['akvariumy'] : catMap['zhivotnye']
  }))

  const { data: prods, error: prodErr } = await supabase
    .from('products')
    .upsert(productsWithCats, { onConflict: 'article' })
    .select()

  if (prodErr) {
    console.error('Products error:', prodErr)
    return
  }

  console.log('Products added:', prods.length)
}

seed()
