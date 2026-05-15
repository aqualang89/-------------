/**
 * Трансформирует Cloudinary URL добавляя f_auto (auto-формат: WebP/AVIF для современных браузеров)
 * и q_auto (auto-quality). Опционально — width / crop.
 *
 * Если URL не от Cloudinary — возвращает как есть.
 *
 * @param {string} url - оригинальный URL картинки
 * @param {Object} [opts]
 * @param {number} [opts.w] - ширина в пикселях (Cloudinary сам отдаст подходящее)
 * @param {string} [opts.c] - crop mode: 'fill' / 'fit' / 'limit' и т.д.
 * @returns {string}
 */
export function cldImage (url, opts = {}) {
  if (!url || typeof url !== 'string') return url
  if (!url.includes('res.cloudinary.com')) return url

  const transforms = ['f_auto', 'q_auto']
  if (opts.w) transforms.push(`w_${opts.w}`)
  if (opts.c) transforms.push(`c_${opts.c}`)

  // Если URL уже имеет /upload/<что-то>/ — вставляем наши трансформации перед существующими,
  // Cloudinary применит обе цепочки. Безопасно для already-uploaded ресурсов.
  return url.replace('/upload/', `/upload/${transforms.join(',')}/`)
}
