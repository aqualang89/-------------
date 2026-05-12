import { supabase } from '~/server/utils/supabase'

function buildTree(cats, parentId = null) {
  return cats
    .filter(c => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(c => ({
      ...c,
      children: buildTree(cats, c.id)
    }))
}

const HIDDEN_CATEGORY_SLUGS = ['morskaya-akvariumistika']
const HIDDEN_CATEGORY_NAME_PATTERNS = [/^морск/i]

export default defineEventHandler(async () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return []
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  const tree = buildTree(data || [])
  const visibleTree = tree.filter(node =>
    !HIDDEN_CATEGORY_SLUGS.includes(node.slug) &&
    !HIDDEN_CATEGORY_NAME_PATTERNS.some(p => p.test(node.name))
  )
  return visibleTree
})
