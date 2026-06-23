import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useBlocker } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.js'
import { APP_NAME, DAY_NAMES, DAYS } from '../../lib/constants.js'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { Input, Textarea } from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'

const UNITS = [
  { v: 'u', label: 'u' },
  { v: 'g', label: 'g' },
  { v: 'kg', label: 'kg' },
  { v: 'ml', label: 'ml' },
]

export default function Plans() {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState([])
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [isNewTemplate, setIsNewTemplate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmStep, setConfirmStep] = useState(1)
  const [usersCount, setUsersCount] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: t }, { data: f }] = await Promise.all([
        supabase.from('plan_templates').select('*, plan_items(*)').order('created_at', { ascending: false }),
        supabase.from('foods').select('id, name, brand').order('name'),
      ])
      setTemplates(t || [])
      setFoods(f || [])
      setLoading(false)
    }
    load()
  }, [])

  const createTemplate = () => {
    setIsNewTemplate(true)
    setEditing({
      id: null,
      name: 'Nuevo plan',
      description: '',
      duration_days: 28,
      price: 0,
      is_active: true,
      plan_items: [],
    })
    setMsg(null)
  }

  const editTemplate = (t) => {
    setIsNewTemplate(false)
    setEditing(t)
    setMsg(null)
  }

  const saveTemplate = async (t) => {
    if (isNewTemplate) {
      const { plan_items, id: _id, ...rest } = t
      const { data: created, error } = await supabase
        .from('plan_templates')
        .insert(rest)
        .select()
        .single()
      if (error) { setMsg({ type: 'err', text: error.message }); return false }
      if (plan_items.length) {
        const items = plan_items.map((it, i) => ({
          plan_template_id: created.id,
          week_number: it.week_number || 1,
          day_of_week: it.day_of_week || 1,
          slot_name: it.slot_name,
          order_index: it.order_index ?? i,
          foods: it.foods || [],
          notes: it.notes || null,
        }))
        const { error: e2 } = await supabase.from('plan_items').insert(items)
        if (e2) { setMsg({ type: 'err', text: e2.message }); return false }
      }
      setMsg({ type: 'ok', text: 'Plan creado.' })
      const { data: full } = await supabase
        .from('plan_templates')
        .select('*, plan_items(*)')
        .eq('id', created.id)
        .single()
      setTemplates((prev) => [full, ...prev])
      closeEditor()
      return true
    }

    const { plan_items, ...rest } = t
    const { error } = await supabase.from('plan_templates').update(rest).eq('id', t.id)
    if (error) { setMsg({ type: 'err', text: error.message }); return false }
    await supabase.from('plan_items').delete().eq('plan_template_id', t.id)
    if (plan_items.length) {
      const items = plan_items.map((it, i) => ({
        plan_template_id: t.id,
        week_number: it.week_number || 1,
        day_of_week: it.day_of_week || 1,
        slot_name: it.slot_name,
        order_index: it.order_index ?? i,
        foods: it.foods || [],
        notes: it.notes || null,
      }))
      const { error: e2 } = await supabase.from('plan_items').insert(items)
      if (e2) { setMsg({ type: 'err', text: e2.message }); return false }
    }
    setMsg({ type: 'ok', text: 'Plan guardado.' })
    const { data } = await supabase.from('plan_templates').select('*, plan_items(*)').eq('id', t.id).single()
    setTemplates((prev) => prev.map((x) => (x.id === t.id ? data : x)))
    closeEditor()
    return true
  }

  const openDeleteConfirm = async (tpl) => {
    setConfirmDelete(tpl)
    setConfirmStep(1)
    setMsg(null)
    const { count } = await supabase
      .from('user_plans')
      .select('id', { count: 'exact', head: true })
      .eq('plan_template_id', tpl.id)
    setUsersCount(count || 0)
  }

  const closeDelete = () => {
    setConfirmDelete(null)
    setConfirmStep(1)
    setUsersCount(0)
  }

  const proceedToForceStep = () => {
    setConfirmStep(2)
  }

  const deleteTemplate = async (tpl) => {
    setDeleting(true)
    setMsg(null)
    try {
      const detached = usersCount > 0
      if (detached) {
        await supabase
          .from('user_plans')
          .update({ plan_template_id: null, status: 'expired' })
          .eq('plan_template_id', tpl.id)
      }
      await supabase.from('plan_items').delete().eq('plan_template_id', tpl.id)
      const { error } = await supabase.from('plan_templates').delete().eq('id', tpl.id)
      if (error) throw error

      setTemplates((prev) => prev.filter((x) => x.id !== tpl.id))
      setMsg({
        type: 'ok',
        text: detached
          ? `Plan "${tpl.name}" eliminado. ${usersCount} usuario(s) perdieron el acceso.`
          : `Plan "${tpl.name}" eliminado.`,
      })
      closeDelete()
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Error al eliminar' })
    } finally {
      setDeleting(false)
    }
  }

  const closeEditor = () => {
    setEditing(null)
    setIsNewTemplate(false)
    setMsg(null)
  }

  if (loading) return <Loader />

  return (
    <>
      <Helmet>
        <title>Planes | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white">Plantillas de plan</h2>
        <button onClick={createTemplate} className="bg-accent text-ink text-sm font-bold px-3 py-2 rounded-xl min-h-10">
          + Nueva
        </button>
      </div>

      {msg && <p className={`text-sm mb-2 ${msg.type === 'ok' ? 'text-accent' : 'text-red-400'}`}>{msg.text}</p>}

      {editing ? (
        <PlanEditor
          template={editing}
          foods={foods}
          isNew={isNewTemplate}
          onSave={saveTemplate}
          onCancel={closeEditor}
        />
      ) : templates.length === 0 ? (
        <Card><p className="text-sm text-muted-light">Sin plantillas.</p></Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-muted-light mt-0.5">
                    {t.duration_days} dias ({Math.ceil(t.duration_days / 7)} semanas) · {t.plan_items?.length || 0} comidas
                    {t.is_active ? '' : ' · inactivo'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => editTemplate(t)} className="text-accent text-sm font-bold px-2 py-1 min-h-0">Editar</button>
                  <button onClick={() => openDeleteConfirm(t)} className="text-red-400 text-sm font-bold px-2 py-1 min-h-0">Eliminar</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {confirmDelete && (
        <DeletePlanModal
          plan={confirmDelete}
          step={confirmStep}
          usersCount={usersCount}
          deleting={deleting}
          onCancel={closeDelete}
          onConfirm={usersCount > 0 && confirmStep === 1 ? proceedToForceStep : () => deleteTemplate(confirmDelete)}
        />
      )}
    </>
  )
}

function DeletePlanModal({ plan, step, usersCount, deleting, onCancel, onConfirm }) {
  if (step === 2) {
    return (
      <div
        className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        onClick={onCancel}
      >
        <div
          className="bg-ink-800 border-2 border-red-500 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-red-500/30 border-2 border-red-500 animate-pulse">
            <svg className="w-9 h-9 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>

          <h3 className="text-xl font-extrabold text-red-400 text-center mb-2">ULTIMA CONFIRMACION</h3>
          <p className="text-sm text-white text-center mb-1">
            Hay <strong className="text-red-400">{usersCount}</strong> usuario(s) con este plan
          </p>
          <p className="text-sm text-muted-light text-center mb-4">
            Si eliminas este plan, <strong className="text-white">perderan acceso</strong> a sus comidas inmediatamente.
          </p>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-xs text-white text-center">
              Vas a <strong className="text-red-400">desvincular a {usersCount} usuario(s)</strong> y eliminar
              <strong className="text-red-400"> {plan.plan_items?.length || 0} comidas</strong> para siempre.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="w-full bg-red-600 text-white font-extrabold py-4 px-6 rounded-xl min-h-14 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {deleting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Eliminando...
                </span>
              ) : (
                'ELIMINAR DE TODAS FORMAS'
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={deleting}
              className="w-full bg-transparent text-muted-light border border-ink-700 font-bold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              No, cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

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
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-white text-center mb-2">Eliminar plan</h3>
        <p className="text-sm text-muted-light text-center mb-1">¿Seguro que querés eliminar</p>
        <p className="text-base font-bold text-white text-center mb-3">"{plan.name}"?</p>

        <div className="bg-ink-900 border border-ink-700 rounded-xl p-3 mb-4 space-y-1.5">
          <p className="text-xs text-muted-light flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>Se borraran <strong className="text-white">{plan.plan_items?.length || 0}</strong> comidas del plan</span>
          </p>
          <p className="text-xs text-muted-light flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>Esta accion <strong className="text-white">no se puede deshacer</strong></span>
          </p>
          {usersCount > 0 ? (
            <p className="text-xs text-amber-400 flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span><strong>{usersCount}</strong> usuario(s) con este plan seran <strong>desvinculados</strong></span>
            </p>
          ) : (
            <p className="text-xs text-muted-light flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>No hay usuarios con este plan</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            Si, eliminar
          </button>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="w-full bg-transparent text-muted-light border border-ink-700 font-bold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function PlanEditor({ template, foods, isNew, onSave, onCancel }) {
  const [t, setT] = useState({
    ...template,
    plan_items: (template.plan_items || []).map((it) => ({
      week_number: it.week_number || 1,
      day_of_week: it.day_of_week || 1,
      slot_name: it.slot_name,
      foods: normalizeFoods(it.foods),
      notes: it.notes || '',
    })),
  })
  const initialRef = useRef(JSON.stringify({
    name: template.name,
    description: template.description || '',
    duration_days: template.duration_days,
    price: template.price,
    plan_items: template.plan_items || [],
  }))
  const isDirty = JSON.stringify({
    name: t.name,
    description: t.description || '',
    duration_days: t.duration_days,
    price: t.price,
    plan_items: t.plan_items,
  }) !== initialRef.current

  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Block in-app navigation when dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowLeaveModal(true)
    }
  }, [blocker])

  // Browser navigation warning
  useEffect(() => {
    if (!isDirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const totalWeeks = Math.max(1, Math.ceil(t.duration_days / 7))

  const updateMeta = (field, value) => {
    setT((p) => ({ ...p, [field]: value }))
  }

  const addMeal = (week, day) => {
    setT((p) => ({
      ...p,
      plan_items: [
        ...p.plan_items,
        { week_number: week, day_of_week: day, slot_name: 'Nueva comida', foods: [], notes: '' },
      ],
    }))
  }

  const updateMeal = (idx, patch) => {
    setT((p) => ({
      ...p,
      plan_items: p.plan_items.map((it, j) => (j === idx ? { ...it, ...patch } : it)),
    }))
  }

  const removeMeal = (idx) => {
    setT((p) => ({ ...p, plan_items: p.plan_items.filter((_, j) => j !== idx) }))
  }

  const copyWeek = (fromWeek, toWeek) => {
    if (fromWeek === toWeek) return
    const source = t.plan_items.filter((it) => it.week_number === fromWeek)
    const withoutTarget = t.plan_items.filter((it) => it.week_number !== toWeek)
    const copy = source.map((it) => ({
      week_number: toWeek,
      day_of_week: it.day_of_week,
      slot_name: it.slot_name,
      foods: it.foods,
      notes: it.notes,
    }))
    setT((p) => ({ ...p, plan_items: [...withoutTarget, ...copy] }))
  }

  const clearWeek = (week) => {
    setT((p) => ({ ...p, plan_items: p.plan_items.filter((it) => it.week_number !== week) }))
  }

  const handleSave = async () => {
    setSaving(true)
    const ok = await onSave(t)
    setSaving(false)
    if (ok) initialRef.current = JSON.stringify(t)
  }

  const tryCancel = () => {
    if (isDirty) setShowLeaveModal(true)
    else onCancel()
  }

  const proceedLeave = () => {
    setShowLeaveModal(false)
    if (blocker.state === 'blocked') blocker.proceed()
    else onCancel()
  }

  const stayEditing = () => {
    setShowLeaveModal(false)
    if (blocker.state === 'blocked') blocker.reset()
  }

  return (
    <>
      <Card>
        <Input
          label="Nombre"
          value={t.name}
          onChange={(e) => updateMeta('name', e.target.value)}
        />
        <div className="mt-3">
          <Input
            label="Duracion (dias)"
            type="number"
            min="1"
            value={t.duration_days}
            onChange={(e) => updateMeta('duration_days', parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="mt-3">
          <Input
            label="Precio (S/)"
            type="number"
            step="0.01"
            value={t.price}
            onChange={(e) => updateMeta('price', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="mt-3">
          <Textarea
            label="Descripcion"
            rows={2}
            value={t.description || ''}
            onChange={(e) => updateMeta('description', e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-3">
          <h4 className="font-semibold text-sm text-white">Comidas del plan</h4>
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
            <WeekSection
              key={week}
              week={week}
              totalWeeks={totalWeeks}
              items={t.plan_items}
              foods={foods}
              onAddMeal={(day) => addMeal(week, day)}
              onUpdateMeal={updateMeal}
              onRemoveMeal={removeMeal}
              onCopyFrom={(srcWeek) => copyWeek(srcWeek, week)}
              onClear={() => clearWeek(week)}
            />
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (isNew ? 'Creando...' : 'Guardando...') : (isNew ? 'Crear plan' : 'Guardar')}
          </Button>
          <button onClick={tryCancel} className="flex-1 text-muted-light font-bold py-3">
            Cancelar
          </button>
        </div>
        {isDirty && (
          <p className="text-xs text-accent mt-2">Tienes cambios sin guardar</p>
        )}
      </Card>

      {showLeaveModal && (
        <LeaveModal
          onStay={stayEditing}
          onLeave={proceedLeave}
        />
      )}
    </>
  )
}

function WeekSection({ week, totalWeeks, items, foods, onAddMeal, onUpdateMeal, onRemoveMeal, onCopyFrom, onClear }) {
  const [showCopy, setShowCopy] = useState(false)
  const weekItems = items.filter((it) => it.week_number === week)
  const mealCount = weekItems.length
  const otherWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter((w) => w !== week)

  return (
    <div className="border border-ink-700 rounded-xl overflow-hidden">
      <div className="bg-ink-800 px-3 py-2 flex items-center justify-between">
        <div>
          <p className="font-bold text-white text-sm">Semana {week}</p>
          <p className="text-xs text-muted-light">{mealCount} comida{mealCount === 1 ? '' : 's'}</p>
        </div>
        <div className="flex items-center gap-1">
          {otherWeeks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCopy(true)}
              className="text-xs text-accent font-bold px-2 py-1 min-h-0"
            >
              Copiar
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (mealCount === 0 || confirm(`Limpiar todas las comidas de la semana ${week}?`)) onClear()
            }}
            className="text-xs text-muted-light hover:text-red-400 px-2 py-1 min-h-0"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="p-2 space-y-2">
        {DAYS.map((day) => {
          const dayMeals = weekItems
            .map((meal, idx) => ({ ...meal, _idx: items.indexOf(meal) }))
            .filter((m) => m.day_of_week === day)
            .sort((a, b) => (a.slot_name || '').localeCompare(b.slot_name || ''))
          return (
            <DaySection
              key={day}
              day={day}
              meals={dayMeals}
              foods={foods}
              onAddMeal={() => onAddMeal(day)}
              onUpdateMeal={onUpdateMeal}
              onRemoveMeal={onRemoveMeal}
            />
          )
        })}
      </div>

      {showCopy && (
        <CopyWeekModal
          currentWeek={week}
          otherWeeks={otherWeeks}
          onCopy={(src) => { onCopyFrom(src); setShowCopy(false) }}
          onClose={() => setShowCopy(false)}
        />
      )}
    </div>
  )
}

function DaySection({ day, meals, foods, onAddMeal, onUpdateMeal, onRemoveMeal }) {
  return (
    <div className="bg-ink-900 rounded-lg p-2">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-bold text-muted-light uppercase tracking-wide">{DAY_NAMES[day]}</p>
        <button
          type="button"
          onClick={onAddMeal}
          className="text-xs text-accent font-bold min-h-0"
        >
          + Comida
        </button>
      </div>
      <div className="space-y-2">
        {meals.length === 0 ? (
          <p className="text-xs text-muted italic py-1">Sin comidas</p>
        ) : (
          meals.map((meal) => (
            <SlotEditor
              key={meal._idx}
              item={meal}
              foods={foods}
              onUpdate={(patch) => onUpdateMeal(meal._idx, patch)}
              onRemove={() => onRemoveMeal(meal._idx)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SlotEditor({ item, foods, onUpdate, onRemove }) {
  const [newFoodId, setNewFoodId] = useState('')
  const [newQty, setNewQty] = useState(1)
  const [newUnit, setNewUnit] = useState('u')

  const availableFoods = foods.filter((f) => !item.foods.some((e) => e.id === f.id))

  const addFood = () => {
    if (!newFoodId) return
    onUpdate({ foods: [...item.foods, { id: newFoodId, qty: Number(newQty) || 0, unit: newUnit }] })
    setNewFoodId('')
    setNewQty(1)
    setNewUnit('u')
  }

  const removeFood = (foodId) => {
    onUpdate({ foods: item.foods.filter((e) => e.id !== foodId) })
  }

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-xl p-2 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nombre (ej: Desayuno)"
          value={item.slot_name}
          onChange={(e) => onUpdate({ slot_name: e.target.value })}
          className="!min-h-9 !py-1.5"
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 text-sm shrink-0 px-2 min-h-0"
          aria-label="Quitar comida"
        >
          ×
        </button>
      </div>

      {item.foods.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.foods.map((entry) => {
            const food = foods.find((f) => f.id === entry.id)
            if (!food) return null
            return (
              <span
                key={entry.id}
                className="inline-flex items-center gap-1.5 bg-ink-700 text-white text-xs px-2.5 py-1 rounded-full"
              >
                {food.name} · {entry.qty}{entry.unit}
                <button
                  type="button"
                  onClick={() => removeFood(entry.id)}
                  className="text-muted-light hover:text-accent text-base leading-none"
                  aria-label={`Quitar ${food.name}`}
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}

      {availableFoods.length > 0 ? (
        <>
          <div className="grid grid-cols-[1fr_auto_auto] gap-1.5 items-end">
            <label className="block">
              <span className="block text-xs text-muted-light mb-1">Alimento</span>
              <select
                value={newFoodId}
                onChange={(e) => setNewFoodId(e.target.value)}
                className="w-full min-h-9 px-2 bg-ink-900 text-white border border-ink-700 rounded-lg text-sm"
              >
                <option value="">{foods.length === 0 ? 'Sin alimentos' : '+ Elegir'}</option>
                {availableFoods.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}{f.brand ? ` (${f.brand})` : ''}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-muted-light mb-1">Cant</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-14 min-h-9 px-2 bg-ink-900 text-white border border-ink-700 rounded-lg text-sm text-center"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-muted-light mb-1">Un</span>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-16 min-h-9 px-2 bg-ink-900 text-white border border-ink-700 rounded-lg text-sm"
              >
                {UNITS.map((u) => <option key={u.v} value={u.v}>{u.label}</option>)}
              </select>
            </label>
          </div>
          {newFoodId && (
            <button type="button" onClick={addFood} className="text-accent text-sm font-bold">
              + Agregar al slot
            </button>
          )}
        </>
      ) : (
        foods.length === 0 ? (
          <p className="text-xs text-muted-light">No hay alimentos en el catalogo. Agrega algunos primero.</p>
        ) : (
          <p className="text-xs text-muted-light">Todos los alimentos ya estan en este slot.</p>
        )
      )}

      <Textarea
        placeholder="Notas (opcional)"
        rows={1}
        value={item.notes}
        onChange={(e) => onUpdate({ notes: e.target.value })}
        className="!py-1.5"
      />
    </div>
  )
}

function CopyWeekModal({ currentWeek, otherWeeks, onCopy, onClose }) {
  const [src, setSrc] = useState(otherWeeks[0])
  return (
    <div className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-4" role="dialog">
      <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5 w-full max-w-sm">
        <h3 className="text-lg font-bold text-white mb-1">Copiar semana</h3>
        <p className="text-sm text-muted-light mb-4">
          Reemplaza todas las comidas de la <strong>semana {currentWeek}</strong> con las de la semana origen.
        </p>
        <label className="block mb-4">
          <span className="block text-sm font-medium text-muted-light mb-1">Copiar de la semana</span>
          <select
            value={src}
            onChange={(e) => setSrc(Number(e.target.value))}
            className="w-full min-h-12 px-4 py-2 bg-ink-900 text-white border border-ink-700 rounded-xl"
          >
            {otherWeeks.map((w) => (
              <option key={w} value={w}>Semana {w}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button onClick={() => onCopy(src)}>Copiar</Button>
          <button onClick={onClose} className="flex-1 text-muted-light font-bold py-3">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function LeaveModal({ onStay, onLeave }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-4" role="dialog">
      <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5 w-full max-w-sm">
        <h3 className="text-lg font-bold text-white mb-1">Tienes cambios sin guardar</h3>
        <p className="text-sm text-muted-light mb-4">
          Si sales ahora vas a perder los cambios. ¿Que queres hacer?
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={onStay}>Seguir editando</Button>
          <button
            onClick={onLeave}
            className="w-full bg-transparent text-red-400 border border-red-400 font-bold py-3 px-6 rounded-xl min-h-12"
          >
            Salir sin guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function normalizeFoods(foods) {
  if (!Array.isArray(foods)) return []
  return foods.map((f) => {
    if (typeof f === 'string') return { id: f, qty: 1, unit: 'u' }
    return { id: f.id, qty: f.qty ?? 1, unit: f.unit ?? 'u' }
  }).filter((f) => f.id)
}
