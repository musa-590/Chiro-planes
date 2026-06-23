import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useBodyMetrics(userId) {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let active = true
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true })
      if (active) {
        setMetrics(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [userId])

  return { metrics, loading }
}
