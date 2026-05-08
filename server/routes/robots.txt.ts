export default defineEventHandler((event) => {
  event.node.res.setHeader('Content-Type', 'text/plain')
  return `User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://riparium.ru/sitemap.xml
`
})
