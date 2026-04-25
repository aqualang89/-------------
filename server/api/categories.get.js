import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data || []
})
