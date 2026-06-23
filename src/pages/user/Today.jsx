import { useAuth } from '../../hooks/useAuth.js'
import { useUserPlan } from '../../hooks/useUserPlan.js'
import { todayISO, isExpired, daysUntil, formatDate } from '../../lib/date.js'
import { APP_NAME, DAY_NAMES } from '../../lib/constants.js'
import DayStatusChip from '../../components/user/DayStatusChip.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { whatsappAcquire, whatsappRenew } from '../../lib/whatsapp.js'
import { CheckIcon, FlameIcon, TrendingUpIcon, TrendingDownIcon } from '../../components/icons.jsx'

export default function Today() {
  const { session } = useAuth()
  const { plan, items, todayLogs, dayStatus, loading, planDay, daysLeft, toggleMeal } = useUserPlan(session?.user?.id)
  const navigate = useNavigate()

  if (loading) return <Loader />

  if (!plan || isExpired(plan.expires_at)) {
    return <EmptyState expired={!!plan && isExpired(plan.expires_at)} />
  }

  const total = items.length
  const done = todayLogs.filter((l) => l.completed).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <>
      <Helmet>
        <title>Hoy | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-4">
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

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-light uppercase tracking-wider">Comidas de hoy</h2>
          {allDone && (
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
              const foodParts = item.foodsResolved?.map((e) => {
                if (!e.food) return null
                return `${e.food.name} ${e.qty}${e.unit}`
              }).filter(Boolean) || []
              const subtitle = foodParts.length > 0
                ? foodParts.join(' + ')
                : (item.notes || 'Sin detalle')
              return (
                <button
                  key={item.id}
                  onClick={() => toggleMeal(item.id, !doneThis)}
                  aria-pressed={doneThis}
                  className={`group w-full text-left rounded-2xl p-4 flex items-center gap-3 min-h-16 active:scale-[0.99] transition-all duration-200 border-2 ${
                    doneThis
                      ? 'bg-accent/10 border-accent'
                      : 'bg-ink-800 border-ink-700 hover:border-muted'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      doneThis
                        ? 'bg-accent border-accent scale-100'
                        : 'border-muted-dark scale-95 group-hover:scale-100 group-hover:border-muted'
                    }`}
                  >
                    {doneThis && <CheckIcon className="w-5 h-5 text-ink" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${doneThis ? 'text-white' : 'text-white'}`}>
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
                  </div>
                </button>
              )
            })
          )}
        </div>

        {allDone && (
          <button
            onClick={() => navigate('/app/close')}
            className="w-full mt-2 bg-accent text-ink font-bold py-4 rounded-2xl min-h-14 shadow-lg shadow-accent/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <FlameIcon className="w-5 h-5" />
            Cerrar mi periodo y enviar resultados
          </button>
        )}
      </div>
    </>
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
