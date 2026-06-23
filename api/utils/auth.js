import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

export const verifyToken = async (token) => {
  const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}
