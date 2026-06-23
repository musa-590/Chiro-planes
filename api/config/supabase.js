import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

export const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
