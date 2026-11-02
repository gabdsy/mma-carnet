import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Faux si .env (en local) ou les variables Vercel (en ligne) ne sont pas remplis.
export const isSupabaseConfigured = Boolean(url && anonKey)

// La clé "anon" est publique par conception : c'est la RLS qui protège les données.
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing')
