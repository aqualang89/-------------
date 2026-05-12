import { cloudinary } from '~/server/utils/cloudinary'

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, statusMessage: 'Неверный пароль' })
  }

  // Проверяем что Cloudinary env vars настроены — иначе бессмысленно идти дальше
  const missing = []
  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME')
  if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY')
  if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET')
  if (missing.length) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudinary не настроен на Vercel: отсутствуют ENV: ' + missing.join(', ')
    })
  }

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

  try {
    const { PassThrough } = await import('stream')
    const result = await new Promise((resolve, reject) => {
      const bufferStream = new PassThrough()
      bufferStream.end(Buffer.from(file.data))

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'aqua-catalog', resource_type: 'auto' },
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
    // Cloudinary error часто имеет err.message + err.http_code
    const cloudinaryMsg = err?.message || err?.error?.message || String(err).slice(0, 200)
    const httpCode = err?.http_code ? ` (Cloudinary HTTP ${err.http_code})` : ''
    throw createError({
      statusCode: 500,
      statusMessage: `Cloudinary upload failed${httpCode}: ${cloudinaryMsg}. Размер файла: ${sizeMB}MB.`
    })
  }
})
