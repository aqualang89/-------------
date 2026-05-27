import { supabase } from '~/server/utils/supabase'

// Одна статья по slug. Черновик виден только с админ-паролем.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const pwd = getHeader(event, 'x-admin-password')
  const isAdmin = pwd && pwd === process.env.ADMIN_PASSWORD

  let q = supabase.from('articles').select('*').eq('slug', slug)
  if (!isAdmin) q = q.eq('is_published', true)

  const { data, error } = await q.maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Ошибка загрузки' })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Статья не найдена' })
  return data
})
