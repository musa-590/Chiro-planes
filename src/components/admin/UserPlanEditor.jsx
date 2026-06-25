import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import { DAYS, DAY_NAMES } from '../../lib/constants.js'

const UNITS = [
  { v: 'u', label: 'u' },
  { v: 'g', label: 'g' },
  { v: 'kg', label: 'kg' },
  { v: 'ml', label: 'ml' },
]

export default function UserPlanEditor({ userPlan, foods }) {
  const [items, setItems] = useState([])
  const [originalItems, setOriginalItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (userPlan?.id) {
      loadItems()
    }
  }, [userPlan?.id])

  const loadItems = async () => {
    setLoading(true)
    try {
      const { data: personalizedItems, error } = await supabase
        .from('plan_items')
        .select('*')
        .eq('user_plan_id', userPlan.id)
        .order('week_number', { ascending: true })
        .order('day_of_week', { ascending: true })
        .order('order_index', { ascending: true })

      if (error) throw error

      let loadedItems = personalizedItems || []

      if (loadedItems.length === 0 && userPlan.plan_template_id) {
        const { data: templateItems, error: tErr } = await supabase
          .from('plan_items')
          .select('*')
          .eq('plan_template_id', userPlan.plan_template_id)
          .is('user_plan_id', null)
          .order('week_number', { ascending: true })
          .order('day_of_week', { ascending: true })
          .order('order_index', { ascending: true })

        if (!tErr && templateItems) {
          loadedItems = templateItems.map((it) => ({
            ...it,
            id: null,
            user_plan_id: userPlan.id,
            _fromTemplate: true,
          }))
          setMsg({ type: 'ok', text: 'Mostrando items del template. Edita lo que necesites y guarda para personalizar.' })
        }
      }

      const normalized = loadedItems.map((it) => ({
        id: it.id,
        user_plan_id: it.user_plan_id,
        slot_name: it.slot_name,
        foods: normalizeFoods(it.foods),
        notes: it.notes || '',
        week_number: it.week_number || 1,
        day_of_week: it.day_of_week || 1,
        order_index: it.order_index || 0,
        _fromTemplate: it._fromTemplate || false,
      }))

      setItems(normalized)
      setOriginalItems(JSON.parse(JSON.stringify(normalized)))
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const totalWeeks = Math.ceil((userPlan?.plan_template?.duration_days || 28) / 7)

  const isDirty = JSON.stringify(items) !== JSON.stringify(originalItems)

  const getItemsForWeek = (weekNumber) => {
    return items.filter((item) => item.week_number === weekNumber)
  }

  const getItemsForDay = (weekNumber, dayOfWeek) => {
    return items.filter(
      (item) => item.week_number === weekNumber && item.day_of_week === dayOfWeek
    )
  }

  // Mutaciones locales (sin guardar a BD)
  const localAddItem = (weekNumber, dayOfWeek) => {
    const orderIndex = getItemsForDay(weekNumber, dayOfWeek).length
    setItems([
      ...items,
      {
        id: null,
        user_plan_id: userPlan.id,
        slot_name: 'Nueva comida',
        foods: [],
        notes: '',
        week_number: weekNumber,
        day_of_week: dayOfWeek,
        order_index: orderIndex,
        _fromTemplate: true,
      },
    ])
  }

  const localUpdateItem = (index, updates) => {
    setItems(items.map((it, i) => (i === index ? { ...it, ...updates } : it)))
  }

  const localDeleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Guardar TODO: reemplazar items personalizados del user_plan
  const handleSaveAll = async () => {
    setSaving(true)
    setMsg(null)
    try {
      // 1. Eliminar items personalizados existentes del user_plan
      const { error: delErr } = await supabase
        .from('plan_items')
        .delete()
        .eq('user_plan_id', userPlan.id)

      if (delErr) throw delErr

      // 2. Si hay items para guardar, insertarlos todos
      if (items.length > 0) {
        const rowsToInsert = items.map((it, i) => ({
          user_plan_id: userPlan.id,
          plan_template_id: userPlan.plan_template_id || null,
          slot_name: it.slot_name,
          foods: it.foods,
          notes: it.notes || null,
          week_number: it.week_number,
          day_of_week: it.day_of_week,
          order_index: i,
        }))

        const { data: inserted, error: insErr } = await supabase
          .from('plan_items')
          .insert(rowsToInsert)
          .select()

        if (insErr) throw insErr

        const normalized = (inserted || []).map((it) => ({
          id: it.id,
          user_plan_id: it.user_plan_id,
          slot_name: it.slot_name,
          foods: normalizeFoods(it.foods),
          notes: it.notes || '',
          week_number: it.week_number || 1,
          day_of_week: it.day_of_week || 1,
          order_index: it.order_index || 0,
          _fromTemplate: false,
        }))

        setItems(normalized)
        setOriginalItems(JSON.parse(JSON.stringify(normalized)))
      } else {
        setItems([])
        setOriginalItems([])
      }

      setMsg({ type: 'ok', text: 'Plan personalizado guardado correctamente.' })
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-muted-light">Cargando items del plan...</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Personalizar plan</h3>
        {isDirty && (
          <span className="text-xs text-amber-400 font-semibold">Cambios sin guardar</span>
        )}
      </div>

      {msg && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            msg.type === 'ok' ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNumber) => {
          const weekItems = getItemsForWeek(weekNumber)
          const isExpanded = expandedWeek === weekNumber

          return (
            <div key={weekNumber} className="border border-ink-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : weekNumber)}
                className="w-full px-4 py-3 bg-ink-800 hover:bg-ink-700 transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-white">Semana {weekNumber}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-light">{weekItems.length} comidas</span>
                  <svg
                    className={`w-5 h-5 text-muted-light transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 bg-ink-900 space-y-4">
                  {DAYS.map((dayOfWeek) => {
                    const dayItems = getItemsForDay(weekNumber, dayOfWeek)
                    const dayItemIndexes = items
                      .map((it, idx) => ({ it, idx }))
                      .filter(({ it }) => it.week_number === weekNumber && it.day_of_week === dayOfWeek)

                    return (
                      <div key={dayOfWeek}>
                        <h4 className="text-sm font-semibold text-muted-light mb-2">
                          {DAY_NAMES[dayOfWeek]}
                        </h4>
                        <div className="space-y-2 ml-2">
                          {dayItemIndexes.map(({ it, idx }) => (
                            <ItemEditor
                              key={idx}
                              item={it}
                              foods={foods}
                              onUpdate={(updates) => localUpdateItem(idx, updates)}
                              onDelete={() => localDeleteItem(idx)}
                              saving={saving}
                            />
                          ))}
                          <button
                            onClick={() => localAddItem(weekNumber, dayOfWeek)}
                            disabled={saving}
                            className="text-sm text-accent hover:text-accent-hover disabled:opacity-50"
                          >
                            + Agregar comida
                          </button>
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

      {/* Botón guardar personalización */}
      <div className="mt-6 flex gap-2">
        <Button
          onClick={handleSaveAll}
          disabled={!isDirty || saving}
          className="flex-1"
        >
          {saving ? 'Guardando...' : 'Guardar personalización'}
        </Button>
        <button
          onClick={() => {
            setItems(JSON.parse(JSON.stringify(originalItems)))
            setMsg(null)
          }}
          disabled={!isDirty || saving}
          className="flex-1 text-muted-light border border-ink-700 font-bold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50"
        >
          Descartar
        </button>
      </div>
    </Card>
  )
}

function ItemEditor({ item, foods, onUpdate, onDelete, saving }) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    slot_name: item.slot_name,
    foods: normalizeFoods(item.foods),
    notes: item.notes || '',
  })

  const handleSave = () => {
    onUpdate(formData)
    setEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      slot_name: item.slot_name,
      foods: normalizeFoods(item.foods),
      notes: item.notes || '',
    })
    setEditing(false)
  }

  const handleAddFood = (foodId) => {
    setFormData({
      ...formData,
      foods: [...formData.foods, { id: foodId, qty: 1, unit: 'u' }],
    })
  }

  const handleRemoveFood = (index) => {
    setFormData({
      ...formData,
      foods: formData.foods.filter((_, i) => i !== index),
    })
  }

  const handleUpdateFood = (index, updates) => {
    setFormData({
      ...formData,
      foods: formData.foods.map((food, i) => (i === index ? { ...food, ...updates } : food)),
    })
  }

  if (!editing) {
    const foodNames = (item.foods || [])
      .map((f) => {
        const food = foods.find((fd) => fd.id === f.id)
        return food ? `${food.name} (${f.qty}${f.unit})` : null
      })
      .filter(Boolean)
      .join(', ')

    return (
      <div className="bg-ink-800 rounded-lg p-3 flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{item.slot_name}</p>
          {foodNames && <p className="text-xs text-muted-light mt-1">{foodNames}</p>}
          {item.notes && <p className="text-xs text-muted mt-1">{item.notes}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            disabled={saving}
            className="text-xs text-accent hover:text-accent-hover disabled:opacity-50"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            disabled={saving}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ink-800 rounded-lg p-3 space-y-3">
      <div>
        <label className="text-xs text-muted-light block mb-1">Nombre</label>
        <input
          type="text"
          value={formData.slot_name}
          onChange={(e) => setFormData({ ...formData, slot_name: e.target.value })}
          className="w-full px-3 py-2 bg-ink-900 border border-ink-700 rounded text-sm text-white"
        />
      </div>

      <div>
        <label className="text-xs text-muted-light block mb-1">Alimentos</label>
        <div className="space-y-2">
          {formData.foods.map((food, index) => {
            const foodData = foods.find((f) => f.id === food.id)
            return (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={food.id}
                  onChange={(e) => handleUpdateFood(index, { id: e.target.value })}
                  className="flex-1 px-2 py-1 bg-ink-900 border border-ink-700 rounded text-xs text-white"
                >
                  <option value="">Seleccionar...</option>
                  {foods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={food.qty}
                  onChange={(e) => handleUpdateFood(index, { qty: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 bg-ink-900 border border-ink-700 rounded text-xs text-white"
                  step="0.1"
                  min="0"
                />
                <select
                  value={food.unit}
                  onChange={(e) => handleUpdateFood(index, { unit: e.target.value })}
                  className="w-16 px-2 py-1 bg-ink-900 border border-ink-700 rounded text-xs text-white"
                >
                  {UNITS.map((u) => (
                    <option key={u.v} value={u.v}>{u.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemoveFood(index)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  ×
                </button>
              </div>
            )
          })}
          <select
            value=""
            onChange={(e) => e.target.value && handleAddFood(e.target.value)}
            className="w-full px-2 py-1 bg-ink-900 border border-ink-700 rounded text-xs text-white"
          >
            <option value="">+ Agregar alimento</option>
            {foods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-light block mb-1">Notas</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 bg-ink-900 border border-ink-700 rounded text-sm text-white"
          rows="2"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm">
          Aplicar
        </Button>
        <Button onClick={handleCancel} disabled={saving} variant="secondary" size="sm">
          Cancelar
        </Button>
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
