import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useBodyMetrics } from '../../hooks/useBodyMetrics.js'
import { APP_NAME, STATUS_LABEL, STATUS_COLOR } from '../../lib/constants.js'
import { formatDate, daysUntil } from '../../lib/date.js'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { Input } from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import UserPlanEditor from '../../components/admin/UserPlanEditor.jsx'

export default function UserDetail() {
  const { id } = useParams()
  const { profile: admin } = useAuth()
  const [user, setUser] = useState(null)
  const [plan, setPlan] = useState(null)
  const [templates, setTemplates] = useState([])
  const [foods, setFoods] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [duration, setDuration] = useState(28)
  const [saving, setSaving] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [msg, setMsg] = useState(null)
  const { metrics, loading: mLoading } = useBodyMetrics(id)

  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.from('profiles').select('*').eq('id', id).single()
      setUser(u)
      const { data: p } = await supabase
        .from('user_plans')
        .select('*, plan_template:plan_templates(*)')
        .eq('user_id', id)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setPlan(p)
      const { data: t } = await supabase.from('plan_templates').select('id, name, duration_days').eq('is_active', true)
      setTemplates(t || [])
      if (t?.[0]) setSelectedTemplate(t[0].id)
      
      // Cargar alimentos para el editor
      const { data: f } = await supabase.from('foods').select('id, name, brand').order('name')
      setFoods(f || [])
    }
    load()
  }, [id])

  const assignPlan = async (e) => {
    e.preventDefault()
    setMsg(null)
    setSaving(true)
    try {
      const starts = new Date()
      const expires = new Date(starts.getTime() + duration * 86_400_000)
      const { data, error } = await supabase.from('user_plans').insert({
        user_id: id,
        plan_template_id: selectedTemplate,
        assigned_by: admin.id,
        starts_at: starts.toISOString(),
        expires_at: expires.toISOString(),
        status: 'active',
      }).select('*, plan_template:plan_templates(*)').single()
      if (error) throw error

      await supabase.from('profiles').update({ status: 'active', plan_expires_at: expires.toISOString() }).eq('id', id)

      await supabase.from('admin_audit').insert({
        admin_id: admin.id,
        action: 'assign_plan',
        target_user_id: id,
        metadata: { plan_template_id: selectedTemplate, duration_days: duration },
      })

      setPlan(data)
      setMsg({ type: 'ok', text: 'Plan asignado correctamente.' })
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <Loader />

  const isInactive = user.status === 'inactive'

  const setStatus = async (newStatus, alsoExpirePlans = false) => {
    setDeactivating(true)
    setMsg(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error

      if (alsoExpirePlans) {
        await supabase
          .from('user_plans')
          .update({ status: 'expired' })
          .eq('user_id', id)
          .eq('status', 'active')
      }

      const { data: u } = await supabase.from('profiles').select('*').eq('id', id).single()
      setUser(u)
      await supabase.from('admin_audit').insert({
        admin_id: admin.id,
        action: `set_status_${newStatus}`,
        target_user_id: id,
        metadata: { previous_status: user.status },
      })
      setMsg({
        type: 'ok',
        text: newStatus === 'inactive'
          ? 'Usuario dado de baja.'
          : 'Usuario reactivado.',
      })
      setConfirmDeactivate(false)
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>{user.full_name || user.email} | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <Link to="/admin/users" className="text-sm text-muted-light">‹ Volver</Link>

      <Card className="mt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{user.full_name || 'Sin nombre'}</h2>
            <p className="text-sm text-muted-light">{user.email}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[user.status] || 'bg-ink-700 text-muted-light'}`}>
            {STATUS_LABEL[user.status] || user.status}
          </span>
        </div>
        {user.phone && <p className="text-sm text-muted-light mt-2">Tel: {user.phone}</p>}
        <div className="mt-3 pt-3 border-t border-ink-700">
          {isInactive ? (
            <button
              onClick={() => setStatus('pending', false)}
              disabled={deactivating}
              className="w-full bg-accent text-ink font-bold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {deactivating ? 'Reactivando...' : 'Reactivar usuario'}
            </button>
          ) : (
            <button
              onClick={() => setConfirmDeactivate(true)}
              disabled={deactivating}
              className="w-full bg-ink-700 text-red-400 border border-red-400/40 font-bold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              Dar de baja
            </button>
          )}
          <p className="text-xs text-muted-light mt-2 text-center">
            {isInactive
              ? 'Reactivar cambia el estado a "Sin plan" para que puedas asignar uno nuevo'
              : 'Dar de baja desactiva al usuario y vence su plan actual'}
          </p>
        </div>
      </Card>

      <h3 className="font-semibold mt-6 mb-2 text-white">Plan actual</h3>
      {plan ? (
        <>
          <Card>
            <p className="font-semibold text-white">{plan.plan_template?.name}</p>
            <p className="text-sm text-muted-light mt-1">
              {formatDate(plan.starts_at)} → {formatDate(plan.expires_at)} ({daysUntil(plan.expires_at)} dias)
            </p>
            <p className="text-xs text-muted mt-1">Estado: {plan.status}</p>
          </Card>

          {plan.status === 'active' && (
            <div className="mt-4">
              <UserPlanEditor userPlan={plan} foods={foods} />
            </div>
          )}
        </>
      ) : (
        <Card><p className="text-muted-light text-sm">Sin plan asignado.</p></Card>
      )}

      <h3 className="font-semibold mt-6 mb-2 text-white">Asignar / reasignar plan</h3>
      <Card>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-light">Primero crea plantillas en Planes.</p>
        ) : (
          <form onSubmit={assignPlan} className="space-y-3">
            <label className="block">
              <span className="block text-sm font-medium text-muted-light mb-1">Plantilla</span>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full min-h-12 px-4 py-2 bg-ink-800 text-white border border-ink-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <Input
              label="Duracion (dias)"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            />
            {msg && (
              <p className={`text-sm ${msg.type === 'ok' ? 'text-accent' : 'text-red-400'}`}>{msg.text}</p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? 'Asignando...' : 'Asignar plan'}
            </Button>
          </form>
        )}
      </Card>

      <h3 className="font-semibold mt-6 mb-2 text-white">Historial de peso y grasa</h3>
      {mLoading ? <Loader /> : metrics.length === 0 ? (
        <Card><p className="text-sm text-muted-light">Sin registros.</p></Card>
      ) : (
        <Card>
          <div className="space-y-2">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm border-b border-ink-700 last:border-0 pb-2">
                <span className="text-muted-light">{formatDate(m.recorded_at)}</span>
                <span className="text-white"><strong>{m.weight_kg}kg</strong> · {m.body_fat_pct}% grasa</span>
              </div>
            ))}
          </div>
          <SimpleChart metrics={metrics} />
        </Card>
      )}

      {confirmDeactivate && (
        <DeactivateModal
          user={user}
          plan={plan}
          deactivating={deactivating}
          onCancel={() => setConfirmDeactivate(false)}
          onConfirm={() => setStatus('inactive', true)}
        />
      )}
    </>
  )
}

function DeactivateModal({ user, plan, deactivating, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-full bg-red-500/20 border-2 border-red-500">
          <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-white text-center mb-2">Dar de baja usuario</h3>
        <p className="text-sm text-muted-light text-center mb-1">¿Desactivar a</p>
        <p className="text-base font-bold text-white text-center mb-3">"{user.full_name || user.email}"?</p>

        <div className="bg-ink-900 border border-ink-700 rounded-xl p-3 mb-4 space-y-1.5">
          <p className="text-xs text-muted-light flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>El usuario pasa a estado <strong className="text-white">Inactivo</strong></span>
          </p>
          {plan && plan.status === 'active' && (
            <p className="text-xs text-muted-light flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>Su plan actual <strong className="text-white">{plan.plan_template?.name}</strong> se vence</span>
            </p>
          )}
          <p className="text-xs text-muted-light flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>No podra ver sus comidas ni registrar progreso</span>
          </p>
          <p className="text-xs text-amber-400 flex items-start gap-2">
            <span className="mt-0.5">⚠</span>
            <span>El usuario <strong>no se elimina</strong>, solo se desactiva. Podes reactivarlo despues.</span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={deactivating}
            className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {deactivating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Dando de baja...
              </span>
            ) : (
              'Si, dar de baja'
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={deactivating}
            className="w-full bg-transparent text-muted-light border border-ink-700 font-bold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function SimpleChart({ metrics }) {
  if (metrics.length < 2) return null
  const w = metrics.map((m) => m.weight_kg)
  const min = Math.min(...w), max = Math.max(...w)
  const range = max - min || 1
  return (
    <div className="mt-4 h-24 flex items-end gap-1">
      {metrics.map((m) => {
        const h = ((m.weight_kg - min) / range) * 80 + 20
        return (
          <div key={m.id} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-accent rounded-t" style={{ height: `${h}%` }} />
            <span className="text-[10px] text-muted">{m.weight_kg}</span>
          </div>
        )
      })}
    </div>
  )
}
