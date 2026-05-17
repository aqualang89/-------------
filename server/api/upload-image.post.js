import { v2 as cloudinary } from 'cloudinary'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { requireAdmin } from '~/server/utils/admin-auth.js'

// AVIF/HEIC — современные iPhone/Android часто шлют под именем .jpg.
// Принимаем, но дальше перекодируем в JPEG для совместимости.
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'])

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  // Читаем env с trim — частая ошибка копи-пасты в Vercel UI: пробел/перенос строки.
  // Конфигурируем Cloudinary каждый раз внутри handler — на случай если модуль закешировал старые env.
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim()
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim()
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim()

  const missing = []
  if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME')
  if (!apiKey) missing.push('CLOUDINARY_API_KEY')
  if (!apiSecret) missing.push('CLOUDINARY_API_SECRET')
  if (missing.length) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudinary ENV пустые после trim (возможно пробел/перенос): ' + missing.join(', ')
    })
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  })

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Нет файла в запросе' })
  }

  const file = formData.find(f => f.name === 'file')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'Файл не найден в form-data' })
  }

  const sizeMB = (file.data.length / 1024 / 1024).toFixed(2)
  if (file.data.length > 4.5 * 1024 * 1024) {
    throw createError({
      statusCode: 413,
      statusMessage: `Файл слишком большой (${sizeMB}MB). Vercel serverless лимит 4.5MB.`
    })
  }

  // MIME sniffing по магическим байтам — content-type из multipart не доверяем.
  // SVG/HTML отсекаются здесь же: у них нет бинарного magic-header картинки,
  // file-type вернёт что-то не-image или undefined.
  const inputBuf = Buffer.from(file.data)
  const sniffed = await fileTypeFromBuffer(inputBuf)
  if (!sniffed || !ALLOWED_MIME.has(sniffed.mime)) {
    throw createError({
      statusCode: 415,
      statusMessage: `Только JPEG/PNG/WebP. Определён тип: ${sniffed?.mime || 'неизвестно'}`
    })
  }

  // sharp .rotate() применит EXIF Orientation и затем выкинет весь EXIF —
  // снимает геолокацию, серийник камеры и прочую утечку метаданных.
  // Перекодируем в исходный формат, чтобы не менять расширение/url-структуру.
  // sharp на Vercel в prebuilt без libheif → не читает AVIF/HEIC.
  // Для этих форматов отдаём оригинал в Cloudinary (он сам перекодирует и снимет metadata).
  // Для jpeg/png/webp — стандартный pipeline через sharp с EXIF strip.
  const sharpFormats = new Set(['image/jpeg', 'image/png', 'image/webp'])
  let cleanBuf
  let resourceType = 'image'
  if (sharpFormats.has(sniffed.mime)) {
    try {
      const pipeline = sharp(inputBuf).rotate()
      if (sniffed.mime === 'image/png') cleanBuf = await pipeline.png().toBuffer()
      else if (sniffed.mime === 'image/webp') cleanBuf = await pipeline.webp({ quality: 88 }).toBuffer()
      else cleanBuf = await pipeline.jpeg({ quality: 88 }).toBuffer()
    } catch (err) {
      console.error('Sharp processing error:', err)
      throw createError({ statusCode: 400, statusMessage: 'Не удалось обработать изображение (повреждённый файл?)' })
    }
  } else {
    // AVIF/HEIC/HEIF — оригинал в Cloudinary. Cloudinary при выдаче снимет metadata
    // (он делает strip по умолчанию для image-ресурсов) и сможет отдавать как JPEG/WebP.
    cleanBuf = inputBuf
  }

  try {
    const { PassThrough } = await import('stream')
    const result = await new Promise((resolve, reject) => {
      const bufferStream = new PassThrough()
      bufferStream.end(cleanBuf)

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'aqua-catalog', resource_type: 'image' },
        (err, res) => {
          if (err) reject(err)
          else resolve(res)
        }
      )
      bufferStream.pipe(uploadStream)
    })

    return { url: result.secure_url, publicId: result.public_id }
  } catch (err) {
    console.error('Cloudinary upload error:', err)
    const cloudinaryMsg = err?.message || err?.error?.message || String(err).slice(0, 200)
    const httpCode = err?.http_code ? ` (Cloudinary HTTP ${err.http_code})` : ''
    throw createError({
      statusCode: 500,
      statusMessage: `Cloudinary upload failed${httpCode}: ${cloudinaryMsg}. Размер: ${sizeMB}MB.`
    })
  }
})
