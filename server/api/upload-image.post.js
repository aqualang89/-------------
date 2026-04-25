import { cloudinary } from '~/server/utils/cloudinary'

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, message: 'Неверный пароль' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'Нет файла' })
  }

  const file = formData.find(f => f.name === 'file')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'Файл не найден' })
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
    throw createError({ statusCode: 500, message: 'Ошибка загрузки фото' })
  }
})
