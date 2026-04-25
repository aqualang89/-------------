import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
  console.warn('Supabase URL or Service Key is missing. Catalog features will not work.')
}

export const supabase = createClient(url || '', key || '')
