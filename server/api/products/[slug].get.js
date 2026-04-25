import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug), product_photos(*)')
    .eq('slug', slug)
    .eq('is_available', true)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, message: 'Товар не найден' })
  }

  return data
})
