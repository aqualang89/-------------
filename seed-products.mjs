import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vbopaqxxhumyauwpqgbs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZib3BhcXh4aHVteWF1d3BxZ2JzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzEyNTIwMywiZXhwIjoyMDkyNzAxMjAzfQ.hTBp4PuLOIkJhDTLKIyqqeK1OdAkrNmCoTsH3YempuE'
)

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
