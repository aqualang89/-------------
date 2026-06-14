import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'

// Финал импорта: 1С = эталон. Чего нет в выгрузке по имени - гасим (is_available=false, НЕ удаляем).
// Вызывается клиентом после заливки всех товаров. Матч по ИМЕНИ - артикулы 1С перемешиваются.
const schema = z.object({
  names: z.array(z.string().min(1).max(300)).min(1).max(10000)
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { names } = await validateBody(event, schema)

  // Защита от битой/частичной выгрузки: слишком короткий список не гасим.
  if (names.length < 50) {
    throw createError({ statusCode: 400, message: `В выгрузке всего ${names.length} товаров - подозрительно мало, гашение отменено` })
  }

  const present = new Set(names.map(n => n.trim()))

  let all = []
  let from = 0
  while (true) {
    const { data, error } = await supabase.from('products').select('id, name, is_available').range(from, from + 999)
    if (error) throw createError({ statusCode: 500, message: error.message })
    all = all.concat(data)
    if (data.length < 1000) break
    from += 1000
  }

  const toGase = all.filter(p => p.is_available && !present.has(p.name)).map(p => p.id)

  // Не гасим больше 40% каталога за раз - страховка от кривого файла.
  if (toGase.length > all.length * 0.4) {
    throw createError({ statusCode: 400, message: `Под гашение попало ${toGase.length} из ${all.length} - слишком много, отменено (проверь выгрузку)` })
  }

  let gased = 0
  const errors = []
  for (let i = 0; i < toGase.length; i += 50) {
    const batch = toGase.slice(i, i + 50)
    const { error } = await supabase.from('products').update({ is_available: false }).in('id', batch)
    if (error) errors.push(error.message)
    else gased += batch.length
  }

  return { gased, errors }
})
