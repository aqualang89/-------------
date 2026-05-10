import { supabase } from '~/server/utils/supabase'

const BASE_URL = 'https://рипарий.рф'

export default defineEventHandler(async (event) => {
  const today = new Date().toISOString().split('T')[0]

  // Static pages
  const urls = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/catalog', changefreq: 'daily', priority: '0.9' },
    { loc: '/services', changefreq: 'weekly', priority: '0.8' },
    { loc: '/calculator', changefreq: 'monthly', priority: '0.7' },
    { loc: '/about', changefreq: 'monthly', priority: '0.7' },
    { loc: '/cart', changefreq: 'monthly', priority: '0.5' }
  ]

  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')

  if (categories) {
    for (const cat of categories) {
      urls.push({
        loc: `/catalog?category=${cat.slug}`,
        changefreq: 'weekly',
        priority: '0.8'
      })
    }
  }

  // Products (available only)
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_available', true)

  if (products) {
    for (const p of products) {
      const lastmod = p.updated_at
        ? p.updated_at.split('T')[0]
        : today
      urls.push({
        loc: `/catalog/${p.slug}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.6'
      })
    }
  }

  const urlset = urls.map(u => {
    const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''
    return `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    ${lastmod}<changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml')
  return xml
})
