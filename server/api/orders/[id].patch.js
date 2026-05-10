import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = event.context.params?.id || event.path?.split('/').pop()
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID required' })
  }

  const body = await readBody(event)
  const { status } = body || {}

  if (!status) {
    throw createError({ statusCode: 400, statusMessage: 'Status required' })
  }

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Order patch error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update order' })
  }

  return { ok: true }
})
