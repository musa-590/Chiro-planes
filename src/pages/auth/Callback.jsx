import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'

export default function Callback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handle = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      navigate(session ? '/' : '/', { replace: true })
    }
    handle()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <p className="text-muted-light">Iniciando sesion...</p>
    </div>
  )
}
