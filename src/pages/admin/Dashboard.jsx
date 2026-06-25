import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { APP_NAME } from '../../lib/constants.js'
import { todayLongDate } from '../../lib/date.js'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'

export default function Dashboard() {
  const [stats, setStats] = useState({ active: 0, expired: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [a, e, p, i] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
      ])
      setStats({
        active: a.count || 0,
        expired: e.count || 0,
        pending: p.count || 0,
        inactive: i.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Loader />

  return (
    <>
      <Helmet>
        <title>Panel | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-accent">{todayLongDate()}</p>
      </div>

      <h2 className="text-xl font-bold mb-3 text-white">Resumen</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-accent">{stats.active}</p>
          <p className="text-xs text-muted-light mt-1">Activos</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
          <p className="text-xs text-muted-light mt-1">Pendientes</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
          <p className="text-xs text-muted-light mt-1">Vencidos</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-muted">{stats.inactive}</p>
          <p className="text-xs text-muted-light mt-1">Inactivos</p>
        </Card>
      </div>

      <div className="mt-6 space-y-2">
        <Link to="/admin/users" className="block">
          <Card className="flex items-center justify-between">
            <span className="font-semibold text-white">Ver usuarios</span>
            <span className="text-muted">›</span>
          </Card>
        </Link>
        <Link to="/admin/plans" className="block">
          <Card className="flex items-center justify-between">
            <span className="font-semibold text-white">Gestionar planes</span>
            <span className="text-muted">›</span>
          </Card>
        </Link>
        <Link to="/admin/foods" className="block">
          <Card className="flex items-center justify-between">
            <span className="font-semibold text-white">Catalogo de alimentos</span>
            <span className="text-muted">›</span>
          </Card>
        </Link>
      </div>
    </>
  )
}
