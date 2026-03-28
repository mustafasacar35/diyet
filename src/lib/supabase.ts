
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing! Please check .env.local')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
