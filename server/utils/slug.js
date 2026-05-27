import { supabase } from './supabase'

const MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya'
}

export function slugify (str) {
  if (!str) return ''
  return String(str)
    .toLowerCase()
    .split('')
    .map(c => MAP[c] || c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

// Уникальный slug в таблице: к занятому добавляем -2, -3...
// excludeId — чтобы при правке записи её собственный slug не считался занятым.
export async function uniqueSlug (table, title, excludeId = null) {
  const base = slugify(title) || `item-${Date.now()}`
  let slug = base
  for (let i = 2; i < 50; i++) {
    let q = supabase.from(table).select('id').eq('slug', slug).limit(1)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q
    if (!data || data.length === 0) return slug
    slug = `${base}-${i}`
  }
  return `${base}-${Date.now()}`
}
