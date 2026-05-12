export default defineEventHandler((event) => {
  event.node.res.setHeader('Content-Type', 'text/plain')
  return `User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://xn--80apbe1aed.xn--p1ai/sitemap.xml
`
})
