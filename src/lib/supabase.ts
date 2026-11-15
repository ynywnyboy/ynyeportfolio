import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Supabase's newer dashboards call this the "publishable" key; older ones call it "anon".
// Either name works; both are safe to expose in the browser (data is protected by Row Level Security).
const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const isConfigured = Boolean(url && anon && !url.includes('YOUR-PROJECT'))

export const supabase = createClient(
  isConfigured ? url! : 'http://localhost:54321',
  isConfigured ? anon! : 'public-anon-key-missing',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)

export const BUCKET = 'couple-media'
