import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../hooks/useAuth.js'
import { supabase } from '../../lib/supabase.js'
import { APP_NAME, DAY_NAMES } from '../../lib/constants.js'
import { formatDate } from '../../lib/date.js'
import DayStatusChip from '../../components/user/DayStatusChip.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { CalendarIcon, CheckIcon, FlameIcon, ChartIcon } from '../../components/icons.jsx'

const STATUS_META = {
  complete: { label: 'Cumplido', className: 'bg-accent text-ink', dot: 'bg-accent' },
  incomplete: { label: 'Incompleto', className: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  no_record: { label: 'Sin registro', className: 'bg-ink-700 text-muted-light border border-ink-700', dot: 'bg-ink-700' },
}

export default function History() {
  const { session } = useAuth()
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('complete')

  useEffect(() => {
    if (!session) return
    const load = async () => {
      const since = new Date()
      since.setDate(since.getDate() - 29)

      const { data: plan } = await supabase
        .from('user_plans')
        .select('id, plan_template_id')
        .eq('user_id', session.user.id)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!plan) { setLoading(false); return }

      const { data: items } = await supabase
        .from('plan_items')
        .select('id, plan_template_id')

      const itemIds = new Set(
        (items || []).filter((i) => i.plan_template_id === plan.plan_template_id).map((i) => i.id)
      )
      const total = itemIds.size

      const { data: logs } = await supabase
        .from('meal_logs')
        .select('log_date, completed, plan_item_id')
        .eq('user_plan_id', plan.id)
        .gte('log_date', since.toISOString().slice(0, 10))

      const grouped = {}
      for (const l of logs || []) {
        if (!itemIds.has(l.plan_item_id)) continue
        if (!grouped[l.log_date]) grouped[l.log_date] = { done: 0 }
        if (l.completed) grouped[l.log_date].done++
      }

      const arr = []
      for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        const date = d.toISOString().slice(0, 10)
        const done = grouped[date]?.done || 0
        let status
        if (total === 0) status = 'no_record'
        else if (done === 0) status = 'no_record'
        else if (done === total) status = 'complete'
        else status = 'incomplete'
        arr.push({ date, status, done, total })
      }
      setDays(arr)
      setLoading(false)
    }
    load()
  }, [session])

  if (loading) return <Loader />

  const stats = {
    complete: days.filter((d) => d.status === 'complete').length,
    incomplete: days.filter((d) => d.status === 'incomplete').length,
    no_record: days.filter((d) => d.status === 'no_record').length,
  }
  const adherence = days.length > 0 ? Math.round((stats.complete / days.length) * 100) : 0

  const today = new Date().toISOString().slice(0, 10)
  const realDays = days.filter((d) => d.status !== 'no_record')
  const filtered = filter === 'all' ? realDays : realDays.filter((d) => d.status === filter)

  return (
    <>
      <Helmet>
        <title>Historial | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-4">
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center shrink-0">
              <ChartIcon className="w-6 h-6 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-light uppercase tracking-wider font-bold">Adherencia 30 dias</p>
              <p className="text-3xl font-extrabold text-white leading-none mt-1">{adherence}%</p>
              <p className="text-xs text-muted-light mt-1">
                {stats.complete} cumplido{days.length !== 1 ? 's' : ''} · {stats.incomplete} incompleto{days.length !== 1 ? 's' : ''} · {stats.no_record} sin registro
              </p>
            </div>
          </div>

          <div className="h-2 bg-ink-700 rounded-full overflow-hidden flex">
            <div className="bg-accent transition-all duration-500" style={{ width: `${(stats.complete / 30) * 100}%` }} />
            <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(stats.incomplete / 30) * 100}%` }} />
            <div className="bg-ink-700 transition-all duration-500" style={{ width: `${(stats.no_record / 30) * 100}%` }} />
          </div>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={filter === 'complete'} onClick={() => setFilter('complete')} dot="bg-accent">
            Cumplidos ({stats.complete})
          </FilterChip>
          <FilterChip active={filter === 'incomplete'} onClick={() => setFilter('incomplete')} dot="bg-amber-500">
            Incompletos ({stats.incomplete})
          </FilterChip>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Con actividad ({realDays.length})
          </FilterChip>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <p className="text-muted-light text-center text-sm py-2">
                {filter === 'complete'
                  ? 'Aun no completaste un dia entero. Marca todas las comidas de un dia y aparecera aca.'
                  : 'Sin dias con este filtro.'}
              </p>
            </Card>
          ) : (
            filtered.map((d) => {
              const date = new Date(d.date + 'T12:00:00')
              const dayNum = date.getDate()
              const dayShort = DAY_NAMES[(date.getDay() || 7)]
              const isToday = d.date === today
              const meta = STATUS_META[d.status]
              return (
                <Card key={d.date} className="flex items-center gap-3">
                  <div className={`shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                    isToday ? 'bg-accent text-ink' : 'bg-ink-700 text-white'
                  }`}>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{dayShort.slice(0, 3)}</span>
                    <span className="text-xl font-extrabold leading-none">{dayNum}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {isToday ? 'Hoy' : formatDate(d.date)}
                    </p>
                    <p className="text-xs text-muted-light mt-0.5">
                      {d.status === 'complete'
                        ? `${d.done}/${d.total} comidas`
                        : d.status === 'incomplete'
                          ? `${d.done}/${d.total} comidas`
                          : 'No marcaste nada'}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${meta.className}`}>
                    {meta.label}
                  </span>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

function FilterChip({ active, onClick, children, dot }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 min-h-0 transition-colors ${
        active ? 'bg-accent text-ink' : 'bg-ink-800 text-muted-light border border-ink-700'
      }`}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
      {children}
    </button>
  )
}
