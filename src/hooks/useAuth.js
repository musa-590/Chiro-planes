import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    let active = true
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!active) return
      setSession(s)
      if (s) await loadProfile(s.user.id)
      setProfileReady(true)
      setLoading(false)
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      setProfileReady(false)
      if (s) await loadProfile(s.user.id)
      else setProfile(null)
      setProfileReady(true)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  const loadProfile = async (uid) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    if (!error) setProfile(data)
    else setProfile(null)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (session?.user?.id) await loadProfile(session.user.id)
  }

  return { session, profile, loading, profileReady, signInWithGoogle, signOut, refreshProfile }
}
