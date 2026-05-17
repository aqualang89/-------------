// Базовый URL — primary domain в Vercel + наш VPS-прокси работает на него.
// Используется в canonical и OG-тегах.
const SITE_URL = 'https://www.xn--80apbe1aed.xn--p1ai'
const SITE_NAME = 'Рипарий'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`

/**
 * Универсальный composable для SEO-метаданных страницы.
 *
 * @param {Object} opts
 * @param {string} opts.title          — заголовок (без бренда; бренд добавляется автоматом)
 * @param {string} opts.description    — meta description, 70-160 символов
 * @param {string} [opts.ogImage]      — абсолютный URL картинки для OG, дефолт логотип
 * @param {string} [opts.path]         — путь для canonical (по умолчанию текущий route.path)
 * @param {boolean} [opts.noindex]     — добавить <meta name="robots" content="noindex">
 * @param {Array}  [opts.jsonLd]       — массив JSON-LD объектов для structured data
 */
export function usePageMeta ({ title, description, ogImage, path, noindex = false, jsonLd = [] } = {}) {
  const route = useRoute()
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Студия аквариумного дизайна`
  const canonicalUrl = `${SITE_URL}${path ?? route.path}`
  // Соцсетям нужен абсолютный URL картинки. На странице удобно писать '/img/...'
  // — здесь склеиваем с SITE_URL. Cloudinary/полные ссылки оставляем как есть.
  let image = ogImage || DEFAULT_OG_IMAGE
  if (image.startsWith('/')) image = `${SITE_URL}${image}`

  const meta = [
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:locale', content: 'ru_RU' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image }
  ]

  if (noindex) {
    meta.push({ name: 'robots', content: 'noindex, nofollow' })
  }

  const head = {
    title: fullTitle,
    htmlAttrs: { lang: 'ru' },
    meta,
    link: [
      { rel: 'canonical', href: canonicalUrl }
    ]
  }

  if (jsonLd.length) {
    head.script = jsonLd.map(obj => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(obj)
    }))
  }

  useHead(head)
}

/**
 * JSON-LD для LocalBusiness — главная страница.
 * Используется в Google для локальной выдачи / карт.
 */
export function localBusinessJsonLd () {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Рипарий',
    alternateName: 'Студия аквариумного дизайна Рипарий',
    description: 'Дизайн, монтаж и обслуживание аквариумов в Калининграде. Натуральные акваскейпы, оборудование, расходники.',
    url: SITE_URL,
    telephone: '+7-991-382-56-95',
    email: 'kotdavinchi39@mail.ru',
    image: DEFAULT_OG_IMAGE,
    priceRange: '₽₽',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ул. Аксакова, 123',
      addressLocality: 'Калининград',
      addressRegion: 'Калининградская область',
      addressCountry: 'RU'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 54.7104,
      longitude: 20.4522
    },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '11:00',
      closes: '19:00'
    }],
    sameAs: [
      'https://vk.com/riparium_kld',
      'https://t.me/riparium_kld'
    ]
  }
}

/**
 * JSON-LD для Product на товарной странице.
 */
export function productJsonLd (product) {
  if (!product) return null
  const photo = product.product_photos?.find(p => p.is_main)?.url || product.product_photos?.[0]?.url
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.article || undefined,
    description: product.description || `${product.name} — купить в студии Рипарий, Калининград`,
    image: photo || DEFAULT_OG_IMAGE,
    brand: {
      '@type': 'Brand',
      name: 'Рипарий'
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/catalog/${product.slug}`,
      priceCurrency: 'RUB',
      price: product.price,
      availability: product.is_available === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Рипарий'
      }
    }
  }
}

/**
 * JSON-LD для BreadcrumbList на товарной странице.
 * Принимает массив { name, slug } от верхнего уровня к текущему товару.
 */
export function breadcrumbJsonLd (items) {
  if (!items?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`
    }))
  }
}
