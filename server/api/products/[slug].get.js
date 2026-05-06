import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug || event.path?.split('/').pop()

  if (!slug) {
    console.error('No slug found. URL:', event.node.req.url, 'path:', event.path, 'params:', event.context.params)
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug), product_photos(*)')
    .eq('slug', slug)
    .eq('is_available', true)
    .single()

  if (error) {
    console.error('Product fetch error:', error.message, 'slug:', slug)
    throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })
  }

  return data
})
