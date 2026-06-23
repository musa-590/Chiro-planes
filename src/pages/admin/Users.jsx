import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { APP_NAME, STATUS_LABEL, STATUS_COLOR } from '../../lib/constants.js'
import { formatDate } from '../../lib/date.js'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'pending', label: 'Sin plan' },
  { key: 'expired', label: 'Vencidos' },
  { key: 'inactive', label: 'Inactivos' },
]

export default function Users() {
  const [filter, setFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let q1 = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (filter !== 'all') q1 = q1.eq('status', filter)
      const { data } = await q1
      setUsers(data || [])
      setLoading(false)
    }
    load()
  }, [filter])

  const filtered = users.filter((u) =>
    !q || (u.full_name || '').toLowerCase().includes(q.toLowerCase()) || (u.email || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <Helmet>
        <title>Usuarios | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <h2 className="text-xl font-bold mb-3 text-white">Usuarios</h2>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              filter === f.key ? 'bg-accent text-ink font-semibold' : 'bg-ink-800 text-muted-light border border-ink-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Buscar por nombre o email"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full mb-3 min-h-12 px-4 py-2 bg-ink-800 text-white border border-ink-700 rounded-xl placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />

      {loading ? <Loader /> : filtered.length === 0 ? (
        <Card><p className="text-center text-muted-light py-6">Sin usuarios.</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Link key={u.id} to={`/admin/users/${u.id}`} className="block">
              <Card className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{u.full_name || u.email || 'Sin nombre'}</p>
                  <p className="text-xs text-muted-light truncate">{u.email}</p>
                  <p className="text-xs text-muted mt-0.5">Alta: {formatDate(u.created_at)}</p>
                </div>
                <span className={`shrink-0 ml-2 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[u.status] || 'bg-ink-700 text-muted-light'}`}>
                  {STATUS_LABEL[u.status] || u.status}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
