import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { api } from '../../lib/api.js'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import { DAYS, DAY_NAMES } from '../../lib/constants.js'

export default function UserPlanEditor({ userPlan, foods }) {
  const [items, setItems] = useState([])
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
      const response = await api(`/users/${userPlan.user_id}/user-plan-items?user_plan_id=${userPlan.id}`)
      setItems(response.items || [])
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const totalWeeks = Math.ceil(userPlan?.duration_days / 7) || 4

  const getItemsForWeek = (weekNumber) => {
    return items.filter((item) => item.week_number === weekNumber)
  }

  const getItemsForDay = (weekNumber, dayOfWeek) => {
    return items.filter(
      (item) => item.week_number === weekNumber && item.day_of_week === dayOfWeek
    )
  }

  const handleAddItem = async (weekNumber, dayOfWeek) => {
    setSaving(true)
    try {
      const orderIndex = getItemsForDay(weekNumber, dayOfWeek).length
      const response = await api(`/users/${userPlan.user_id}/user-plan-items?user_plan_id=${userPlan.id}`, {
        method: 'POST',
        body: {
          slot_name: 'Nueva comida',
          foods: [],
          notes: '',
          week_number: weekNumber,
          day_of_week: dayOfWeek,
          order_index: orderIndex,
        },
      })
      setItems([...items, response.item])
      setMsg({ type: 'ok', text: 'Comida agregada' })
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItem = async (itemId, updates) => {
    setSaving(true)
    try {
      const response = await api(`/users/user-plan-items/${itemId}`, {
        method: 'PUT',
        body: updates,
      })
      setItems(items.map((item) => (item.id === itemId ? response.item : item)))
      setMsg({ type: 'ok', text: 'Comida actualizada' })
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('¿Eliminar esta comida?')) return
    setSaving(true)
    try {
      await api(`/users/user-plan-items/${itemId}`, { method: 'DELETE' })
      setItems(items.filter((item) => item.id !== itemId))
      setMsg({ type: 'ok', text: 'Comida eliminada' })
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
      <h3 className="text-lg font-bold text-white mb-4">Personalizar plan</h3>

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
                    return (
                      <div key={dayOfWeek}>
                        <h4 className="text-sm font-semibold text-muted-light mb-2">
                          {DAY_NAMES[dayOfWeek]}
                        </h4>
                        <div className="space-y-2 ml-2">
                          {dayItems.map((item) => (
                            <ItemEditor
                              key={item.id}
                              item={item}
                              foods={foods}
                              onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                              onDelete={() => handleDeleteItem(item.id)}
                              saving={saving}
                            />
                          ))}
                          <button
                            onClick={() => handleAddItem(weekNumber, dayOfWeek)}
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
    </Card>
  )
}

function ItemEditor({ item, foods, onUpdate, onDelete, saving }) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    slot_name: item.slot_name,
    foods: item.foods || [],
    notes: item.notes || '',
  })

  const handleSave = () => {
    onUpdate(formData)
    setEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      slot_name: item.slot_name,
      foods: item.foods || [],
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
                  <option value="u">u</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
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
          Guardar
        </Button>
        <Button onClick={handleCancel} disabled={saving} variant="secondary" size="sm">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
