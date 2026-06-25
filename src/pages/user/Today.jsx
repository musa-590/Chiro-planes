import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useUserPlan } from '../../hooks/useUserPlan.js'
import { todayISO, todayLongDate, isExpired, daysUntil, formatDate } from '../../lib/date.js'
import { APP_NAME, DAY_NAMES, DAYS } from '../../lib/constants.js'
import DayStatusChip from '../../components/user/DayStatusChip.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { whatsappAcquire, whatsappRenew } from '../../lib/whatsapp.js'
import { CheckIcon, FlameIcon, TrendingUpIcon, TrendingDownIcon, CalendarIcon } from '../../components/icons.jsx'

export default function Today() {
  const { session } = useAuth()
  const { plan, items, todayLogs, dayStatus, loading, planDay, daysLeft, toggleMeal } = useUserPlan(session?.user?.id)
  const navigate = useNavigate()
  const [expandedMeal, setExpandedMeal] = useState(null)
  const [showFullPlan, setShowFullPlan] = useState(false)

  if (loading) return <Loader />

  if (!plan || isExpired(plan.expires_at)) {
    return <EmptyState expired={!!plan && isExpired(plan.expires_at)} />
  }

  const total = items.length
  const done = todayLogs.filter((l) => l.completed).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total
  const isSunday = new Date().getDay() === 0

  return (
    <>
      <Helmet>
        <title>Hoy | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-4">
        <div className="text-center py-1">
          <p className="text-sm font-semibold text-accent">{todayLongDate()}</p>
        </div>

        {/* Card de progreso + fechas del plan */}
        <Card>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-light font-bold">
                {DAY_NAMES[planDay.day]} · Semana {planDay.week}
              </p>
              <p className="text-3xl font-extrabold text-white leading-tight mt-1">
                {done} <span className="text-muted-light text-2xl">/ {total}</span>
              </p>
              <p className="text-xs text-muted-light mt-0.5">
                {done === 0 ? 'Empieza tu dia' : done === total ? 'Dia completo' : 'Comidas registradas'}
              </p>
            </div>
            <div className="shrink-0 w-14 h-14 rounded-full border-4 flex items-center justify-center font-extrabold text-lg"
              style={{
                borderColor: pct === 100 ? '#F8F063' : pct >= 50 ? '#F8F06380' : '#262626',
                color: pct === 100 ? '#F8F063' : pct >= 50 ? '#F8F063' : '#6B7280',
              }}
            >
              {pct}%
            </div>
          </div>

          <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Fechas del plan */}
          <div className="mt-4 pt-3 border-t border-ink-700 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Inicio</p>
              <p className="text-sm font-semibold text-white mt-0.5">{formatDate(plan.starts_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Termina</p>
              <p className="text-sm font-semibold text-white mt-0.5">{formatDate(plan.expires_at)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-light">
            <span className="flex items-center gap-1.5">
              <FlameIcon className="w-3.5 h-3.5" />
              <span>{pct >= 100 ? 'Racha perfecta' : 'Sigue asi'}</span>
            </span>
            <span>
              Vence en <strong className="text-white">{daysLeft}</strong> dia{daysLeft === 1 ? '' : 's'}
            </span>
          </div>
        </Card>

        {/* Botón ver plan completo */}
        <button
          onClick={() => setShowFullPlan(true)}
          className="w-full bg-ink-800 border border-ink-700 text-muted-light font-semibold py-3 px-4 rounded-xl min-h-12 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <CalendarIcon className="w-5 h-5" />
          Ver plan completo
        </button>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-light uppercase tracking-wider">Comidas de hoy</h2>
          {allDone && isSunday && (
            <button
              onClick={() => navigate('/app/close')}
              className="text-xs bg-accent text-ink font-bold px-3 py-1.5 rounded-full min-h-0"
            >
              Cerrar periodo
            </button>
          )}
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <EmptyMeals />
          ) : (
            items.map((item) => {
              const log = todayLogs.find((l) => l.plan_item_id === item.id)
              const doneThis = log?.completed || false
              const isExpanded = expandedMeal === item.id
              const foodList = item.foodsResolved || []
              const foodParts = foodList.map((e) => {
                if (!e.food) return null
                return `${e.food.name} ${e.qty}${e.unit}`
              }).filter(Boolean)
              const subtitle = foodParts.length > 0
                ? foodParts.join(' + ')
                : (item.notes || 'Sin detalle')

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border-2 transition-all duration-200 ${
                    doneThis
                      ? 'bg-accent/10 border-accent'
                      : 'bg-ink-800 border-ink-700'
                  }`}
                >
                  {/* Fila principal: checkbox + nombre + botón expandir */}
                  <div className="flex items-center gap-3 p-4 min-h-16">
                    {/* Checkbox (toggle done) */}
                    <button
                      onClick={() => toggleMeal(item.id, !doneThis)}
                      aria-pressed={doneThis}
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        doneThis
                          ? 'bg-accent border-accent scale-100'
                          : 'border-muted-dark scale-95 hover:scale-100 hover:border-muted'
                      }`}
                    >
                      {doneThis && <CheckIcon className="w-5 h-5 text-ink" />}
                    </button>

                    {/* Nombre + subtítulo (click para expandir) */}
                    <button
                      onClick={() => setExpandedMeal(isExpanded ? null : item.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">
                          {item.slot_name}
                        </p>
                        {doneThis && (
                          <span className="text-[10px] bg-accent text-ink px-1.5 py-0.5 rounded-full font-bold uppercase">
                            Hecho
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${doneThis ? 'text-muted-light line-through' : 'text-muted-light'}`}>
                        {subtitle}
                      </p>
                    </button>

                    {/* Botón expandir */}
                    <button
                      onClick={() => setExpandedMeal(isExpanded ? null : item.id)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center text-muted-light"
                      aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-2 animate-fadeIn">
                      {foodList.length > 0 ? (
                        foodList.map((entry, idx) => {
                          const food = entry.food
                          if (!food) return null
                          return (
                            <div key={idx} className="flex items-start gap-3 bg-ink-900 rounded-xl p-3">
                              <div className="w-10 h-10 rounded-lg bg-ink-700 flex items-center justify-center shrink-0 text-muted-light text-xs font-bold">
                                {food.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm">{food.name}</p>
                                {food.brand && <p className="text-xs text-muted-light">{food.brand}</p>}
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">
                                    {entry.qty}{entry.unit}
                                  </span>
                                  {food.category && (
                                    <span className="text-xs text-muted">{food.category}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-muted-light text-center py-2">Sin alimentos asignados</p>
                      )}

                      {item.notes && (
                        <div className="bg-ink-900 rounded-xl p-3">
                          <p className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Notas</p>
                          <p className="text-sm text-muted-light">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {allDone && isSunday && (
          <button
            onClick={() => navigate('/app/close')}
            className="w-full mt-2 bg-accent text-ink font-bold py-4 rounded-2xl min-h-14 shadow-lg shadow-accent/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <FlameIcon className="w-5 h-5" />
            Cerrar mi periodo y enviar resultados
          </button>
        )}
      </div>

      {/* Modal: Ver plan completo */}
      {showFullPlan && (
        <FullPlanModal plan={plan} onClose={() => setShowFullPlan(false)} />
      )}
    </>
  )
}

function FullPlanModal({ plan, onClose }) {
  const [allItems, setAllItems] = useState([])
  const [allFoods, setAllFoods] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedWeek, setExpandedWeek] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: items, error } = await supabase
          .from('plan_items')
          .select('*')
          .eq('user_plan_id', plan.id)
          .order('week_number', { ascending: true })
          .order('day_of_week', { ascending: true })
          .order('order_index', { ascending: true })

        if (error) throw error

        const foodIds = new Set()
        for (const it of items || []) {
          for (const f of (it.foods || [])) {
            const id = typeof f === 'string' ? f : f.id
            if (id) foodIds.add(id)
          }
        }

        let foodMap = {}
        if (foodIds.size > 0) {
          const { data: foods } = await supabase
            .from('foods')
            .select('id, name, brand, category')
            .in('id', [...foodIds])
          foodMap = Object.fromEntries((foods || []).map((f) => [f.id, f]))
        }

        setAllItems(items || [])
        setAllFoods(foodMap)
      } catch (err) {
        console.error('Failed to load full plan:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [plan.id])

  const totalWeeks = Math.ceil((plan.plan_template?.duration_days || 28) / 7)

  const getWeekItems = (week) => allItems.filter((it) => it.week_number === week)
  const getDayItems = (week, day) => allItems.filter((it) => it.week_number === week && it.day_of_week === day)

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/95 flex flex-col animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Header del modal */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700 safe-area-pt shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white">Plan completo</h2>
          <p className="text-xs text-muted-light">{plan.plan_template?.name}</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-muted-light text-2xl"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {loading ? (
          <Loader />
        ) : allItems.length === 0 ? (
          <Card><p className="text-muted-light text-center text-sm py-4">Tu plan no tiene comidas configuradas.</p></Card>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
              const weekItems = getWeekItems(week)
              const isExpanded = expandedWeek === week
              return (
                <div key={week} className="border border-ink-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedWeek(isExpanded ? null : week)}
                    className="w-full px-4 py-3 bg-ink-800 flex items-center justify-between"
                  >
                    <span className="font-semibold text-white text-sm">Semana {week}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-light">{weekItems.length} comidas</span>
                      <svg
                        className={`w-4 h-4 text-muted-light transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 space-y-3">
                      {DAYS.map((day) => {
                        const dayItems = getDayItems(week, day)
                        if (dayItems.length === 0) return null
                        return (
                          <div key={day}>
                            <p className="text-xs font-bold text-muted-light uppercase tracking-wider mb-1.5">
                              {DAY_NAMES[day]}
                            </p>
                            <div className="space-y-1.5 ml-2">
                              {dayItems.map((item) => {
                                const foodList = (item.foods || []).map((f) => {
                                  const id = typeof f === 'string' ? f : f.id
                                  const qty = typeof f === 'string' ? 1 : (f.qty || 1)
                                  const unit = typeof f === 'string' ? 'u' : (f.unit || 'u')
                                  const food = allFoods[id]
                                  return food ? { name: food.name, qty, unit, brand: food.brand } : null
                                }).filter(Boolean)

                                return (
                                  <div key={item.id} className="bg-ink-800 rounded-lg p-2.5">
                                    <p className="font-semibold text-white text-sm">{item.slot_name}</p>
                                    {foodList.length > 0 && (
                                      <div className="mt-1 space-y-0.5">
                                        {foodList.map((f, idx) => (
                                          <p key={idx} className="text-xs text-muted-light">
                                            • {f.name} <span className="text-accent font-bold">{f.qty}{f.unit}</span>
                                            {f.brand && <span className="text-muted"> · {f.brand}</span>}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                    {item.notes && (
                                      <p className="text-xs text-muted italic mt-1">{item.notes}</p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyMeals() {
  return (
    <Card>
      <p className="text-muted-light text-center py-4 text-sm">
        Tu plan no tiene comidas configuradas para hoy. Pide al admin que configure tu plan.
      </p>
    </Card>
  )
}

function EmptyState({ expired }) {
  return (
    <Card className="text-center py-12">
      <Helmet>
        <title>{APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="w-20 h-20 mx-auto bg-ink-700 border border-muted rounded-full flex items-center justify-center mb-4">
        {expired ? (
          <TrendingDownIcon className="w-10 h-10 text-red-400" />
        ) : (
          <FlameIcon className="w-10 h-10 text-accent" />
        )}
      </div>
      <h2 className="text-2xl font-extrabold text-white">
        {expired ? 'Tu plan ha vencido' : 'Aun no tienes un plan activo'}
      </h2>
      <p className="mt-2 text-muted-light text-sm max-w-xs mx-auto">
        {expired
          ? 'Renueva tu plan para volver a acceder a tus comidas y seguimiento.'
          : 'Adquiere un plan y nos pondremos en contacto contigo por WhatsApp para activarlo.'}
      </p>
      <a
        href={expired ? whatsappRenew() : whatsappAcquire()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-6 bg-accent text-ink font-bold py-3 px-6 rounded-2xl min-h-12 shadow-lg shadow-accent/20 active:scale-[0.98] transition-transform"
      >
        {expired ? 'Renovar plan' : 'Adquirir plan'}
      </a>
    </Card>
  )
}
