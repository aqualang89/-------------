import { supabase } from '~/server/utils/supabase'

// Одна статья по slug. Черновик виден только с админ-паролем.
export default defineEventHandler(async (event) => {
  // params.slug бывает undefined из-за соседних [id].patch/delete в этой папке — фолбэк на путь
  const slug = event.context.params?.slug || event.path?.split('?')[0].split('/').pop()
  const pwd = getHeader(event, 'x-admin-password')
  const isAdmin = pwd && pwd === process.env.ADMIN_PASSWORD

  let q = supabase.from('articles').select('*').eq('slug', slug)
  if (!isAdmin) q = q.eq('is_published', true)

  const { data, error } = await q.maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Ошибка загрузки' })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Статья не найдена' })
  return data
})
