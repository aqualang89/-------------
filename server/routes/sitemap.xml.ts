export default defineEventHandler((event) => {
  const base = 'https://riparium.ru'
  const now = new Date().toISOString().split('T')[0]

  const pages = [
    { loc: '/', priority: 1.0 },
    { loc: '/services/nature', priority: 0.8 },
    { loc: '/services/iwagumi', priority: 0.8 },
    { loc: '/services/dutch', priority: 0.8 },
    { loc: '/services/biotope', priority: 0.8 },
    { loc: '/services/paludarium', priority: 0.8 },
    { loc: '/catalog', priority: 0.7 },
    { loc: '/calculator', priority: 0.7 },
    { loc: '/services', priority: 0.6 },
    { loc: '/privacy', priority: 0.3 },
    { loc: '/consent', priority: 0.3 },
  ]

  const urls = pages.map(p => `
  <url>
    <loc>${base}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  event.node.res.setHeader('Content-Type', 'application/xml')
  return xml
})
