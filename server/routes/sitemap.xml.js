import { supabase } from '~/server/utils/supabase'

const SITE_URL = 'https://www.xn--80apbe1aed.xn--p1ai'

// Статические страницы — приоритеты заданы вручную
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/catalog', priority: '0.9', changefreq: 'daily' },
  { path: '/services', priority: '0.8', changefreq: 'monthly' },
  { path: '/services/nature', priority: '0.7', changefreq: 'monthly' },
  { path: '/services/iwagumi', priority: '0.7', changefreq: 'monthly' },
  { path: '/services/dutch', priority: '0.7', changefreq: 'monthly' },
  { path: '/services/biotope', priority: '0.7', changefreq: 'monthly' },
  { path: '/services/paludarium', priority: '0.7', changefreq: 'monthly' },
  { path: '/calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/consent', priority: '0.3', changefreq: 'yearly' }
]

// Кэш на 1 час — не идём в Supabase на каждый запрос Googlebot'а
let cached = null
let cachedAt = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 час

async function buildSitemap () {
  const now = new Date().toISOString().slice(0, 10)

  // Все доступные товары
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_available', true)
    .order('updated_at', { ascending: false })
    .limit(50000) // Google sitemap лимит — 50k URL на файл

  if (prodErr) {
    console.error('Sitemap products fetch error:', prodErr.message)
  }

  // Все категории (для URL /catalog?category=slug)
  // В таблице categories нет колонки updated_at — используем текущую дату как lastmod,
  // категории меняются редко, точная дата изменения для них не критична
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('slug')

  if (catErr) {
    console.error('Sitemap categories fetch error:', catErr.message)
  }

  const urls = []

  for (const p of STATIC_PAGES) {
    urls.push({
      loc: `${SITE_URL}${p.path}`,
      lastmod: now,
      changefreq: p.changefreq,
      priority: p.priority
    })
  }

  for (const cat of categories || []) {
    urls.push({
      loc: `${SITE_URL}/catalog?category=${cat.slug}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8'
    })
  }

  for (const prod of products || []) {
    urls.push({
      loc: `${SITE_URL}/catalog/${prod.slug}`,
      lastmod: prod.updated_at ? prod.updated_at.slice(0, 10) : now,
      changefreq: 'weekly',
      priority: '0.6'
    })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return xml
}

export default defineEventHandler(async (event) => {
  const now = Date.now()
  if (cached && now - cachedAt < CACHE_TTL) {
    event.node.res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    event.node.res.setHeader('Cache-Control', 'public, max-age=3600')
    return cached
  }

  try {
    cached = await buildSitemap()
    cachedAt = now
  } catch (e) {
    console.error('Sitemap build failed:', e.message)
    // На случай fail — отдаём прошлый кэш если он есть, иначе минимальный sitemap
    if (cached) return cached
    cached = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map(p => `  <url><loc>${SITE_URL}${p.path}</loc><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>`
    cachedAt = now
  }

  event.node.res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  event.node.res.setHeader('Cache-Control', 'public, max-age=3600')
  return cached
})
