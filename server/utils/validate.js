import { ZodError } from 'zod'

// Парсит body через zod-схему. На фейл — 400 с компактным списком ошибок,
// чтобы клиент понял что именно не так, но без утечки внутренних деталей.
export async function validateBody (event, schema) {
  const body = await readBody(event)
  try {
    return schema.parse(body ?? {})
  } catch (e) {
    if (e instanceof ZodError) {
      const msg = e.issues
        .map(i => `${i.path.join('.') || 'body'}: ${i.message}`)
        .join('; ')
      throw createError({ statusCode: 400, statusMessage: `Validation failed: ${msg}` })
    }
    throw e
  }
}
