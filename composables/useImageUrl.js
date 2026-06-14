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
// Вотермарка: лого 'riparium_watermark' в правом нижнем углу, 10% ширины фото, прозрачность 60%.
// fl_relative делает w_ относительным к базовой картинке (масштабируется под любой размер).
// Накладывается на лету при выдаче - оригиналы в Cloudinary не трогаются, убрать/подкрутить = одна строка.
const WATERMARK = 'l_riparium_watermark,fl_relative,w_0.10,g_south_east,x_15,y_15,o_60'

export function cldImage (url, opts = {}) {
  if (!url || typeof url !== 'string') return url
  if (!url.includes('res.cloudinary.com')) return url

  const transforms = ['f_auto', 'q_auto']
  if (opts.w) transforms.push(`w_${opts.w}`)
  if (opts.c) transforms.push(`c_${opts.c}`)

  // Вотермарка отдельным компонентом (через /), чтобы её w_0.10 не путался с w_ ресайза базы.
  // opts.watermark === false — отключить (напр. для мелких превью, если попросят).
  const chain = opts.watermark === false
    ? transforms.join(',')
    : `${transforms.join(',')}/${WATERMARK}`

  // Если URL уже имеет /upload/<что-то>/ — вставляем наши трансформации перед существующими,
  // Cloudinary применит обе цепочки. Безопасно для already-uploaded ресурсов.
  return url.replace('/upload/', `/upload/${chain}/`)
}
