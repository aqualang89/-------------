import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'

const schema = z.object({
  is_main: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10_000).optional()
}).refine(v => v.is_main !== undefined || v.sort_order !== undefined, {
  message: 'is_main или sort_order обязательны'
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный id' })
  }

  const body = await validateBody(event, schema)

  // Если ставим is_main: true — сначала снимаем флаг с остальных фото товара
  if (body.is_main === true) {
    const { data: photo } = await supabase
      .from('product_photos')
      .select('product_id')
      .eq('id', id)
      .single()
    if (photo) {
      await supabase
        .from('product_photos')
        .update({ is_main: false })
        .eq('product_id', photo.product_id)
        .neq('id', id)
    }
  }

  const updates = {}
  if (typeof body.is_main === 'boolean') updates.is_main = body.is_main
  if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order

  const { error } = await supabase
    .from('product_photos')
    .update(updates)
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})
