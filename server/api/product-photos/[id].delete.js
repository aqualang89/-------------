import { supabase } from '~/server/utils/supabase'
import { requireAdmin } from '~/server/utils/admin-auth.js'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный id' })
  }

  const { error } = await supabase
    .from('product_photos')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})
