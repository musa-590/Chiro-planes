import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { todayISO } from '../lib/date.js'

function planDayFromStart(startsAt) {
  if (!startsAt) return { week: 1, day: 1, dayIndex: 1 }
  const start = new Date(startsAt)
  const now = new Date()
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.floor((nowMid - startMid) / 86_400_000)
  const dayIndex = Math.max(1, days + 1)
  const week = Math.ceil(dayIndex / 7)
  // app numbering: 1=Monday … 7=Sunday
  const startDow = start.getDay() || 7
  const day = ((startDow - 1 + (dayIndex - 1)) % 7) + 1
  return { week, day, dayIndex }
}

export function useUserPlan(userId) {
  const [plan, setPlan] = useState(null)
  const [items, setItems] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [planDay, setPlanDay] = useState({ week: 1, day: 1, dayIndex: 1 })

  useEffect(() => {
    if (!userId) return
    let active = true
    const load = async () => {
      setLoading(true)
      const today = todayISO()
      const { data: plans } = await supabase
        .from('user_plans')
        .select('*, plan_template:plan_templates(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('starts_at', { ascending: false })
        .limit(1)

      const activePlan = plans?.[0]
      if (!activePlan) {
        setPlan(null)
        setItems([])
        setLoading(false)
        return
      }

      const day = planDayFromStart(activePlan.starts_at)
      setPlanDay(day)

      // Consultar items personalizados del user_plan (no del template)
      const { data: planItems } = await supabase
        .from('plan_items')
        .select('*')
        .eq('user_plan_id', activePlan.id)
        .eq('week_number', day.week)
        .eq('day_of_week', day.day)
        .order('order_index', { ascending: true })

      const allFoodIds = (planItems || []).flatMap((it) =>
        (Array.isArray(it.foods) ? it.foods : [])
          .map((entry) => (typeof entry === 'string' ? entry : entry.id))
          .filter(Boolean)
      )
      const uniqueFoodIds = [...new Set(allFoodIds)]
      let foodMap = {}
      if (uniqueFoodIds.length) {
        const { data: foods } = await supabase
          .from('foods')
          .select('id, name, brand, category')
          .in('id', uniqueFoodIds)
        foodMap = Object.fromEntries((foods || []).map((f) => [f.id, f]))
      }

      const itemsResolved = (planItems || []).map((it) => {
        const entries = (Array.isArray(it.foods) ? it.foods : []).map((entry) => {
          if (typeof entry === 'string') return { id: entry, qty: 1, unit: 'u' }
          return { id: entry.id, qty: entry.qty ?? 1, unit: entry.unit ?? 'u' }
        })
        return {
          ...it,
          foodsResolved: entries
            .map((e) => ({ ...e, food: foodMap[e.id] }))
            .filter((e) => e.food),
        }
      })

      const { data: logs } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_plan_id', activePlan.id)
        .eq('log_date', today)

      setPlan(activePlan)
      setItems(itemsResolved)
      setTodayLogs(logs || [])
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [userId])

  const toggleMeal = async (planItemId, completed) => {
    if (!plan) return
    const today = todayISO()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('meal_logs')
      .upsert(
        { user_id: userId, user_plan_id: plan.id, plan_item_id: planItemId, log_date: today, completed, completed_at: completed ? now : null },
        { onConflict: 'user_plan_id,plan_item_id,log_date', ignoreDuplicates: false }
      )
      .select()
      .single()
    if (error) {
      console.error('toggleMeal error:', error)
      return
    }
    setTodayLogs((prev) => {
      const idx = prev.findIndex((l) => l.plan_item_id === planItemId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = data
        return next
      }
      return [...prev, data]
    })
  }

  const dayStatus = (() => {
    if (!items.length) return 'no_record'
    const total = items.length
    const done = todayLogs.filter((l) => l.completed).length
    if (done === 0) return 'no_record'
    if (done === total) return 'complete'
    return 'incomplete'
  })()

  const daysLeft = plan ? Math.ceil((new Date(plan.expires_at).getTime() - Date.now()) / 86_400_000) : null

  return { plan, items, todayLogs, loading, dayStatus, daysLeft, planDay, toggleMeal }
}
