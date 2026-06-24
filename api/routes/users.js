import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminOnly.js'
import { writeLimiter, writeSlowDown } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { assignPlanSchema } from '../schemas/user.schema.js'
import { logger } from '../utils/logger.js'

const router = Router()
router.use(requireAuth, requireAdmin)
router.use(writeLimiter, writeSlowDown)

router.get('/', async (req, res, next) => {
  try {
    const { status, q } = req.query
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    const filtered = q
      ? data.filter((u) =>
          (u.full_name || '').toLowerCase().includes(String(q).toLowerCase()) ||
          (u.email || '').toLowerCase().includes(String(q).toLowerCase())
        )
      : data

    res.json({ users: filtered })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    res.json({ user: data })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/assign-plan', validate(assignPlanSchema), async (req, res, next) => {
  try {
    const { plan_template_id, duration_days } = req.body
    const starts = new Date()
    const expires = new Date(starts.getTime() + duration_days * 86_400_000)

    const { data: existing } = await supabaseAdmin
      .from('user_plans')
      .select('id')
      .eq('user_id', req.params.id)
      .eq('status', 'active')

    if (existing?.length) {
      await supabaseAdmin
        .from('user_plans')
        .update({ status: 'completed' })
        .in('id', existing.map((p) => p.id))
    }

    const { data, error } = await supabaseAdmin
      .from('user_plans')
      .insert({
        user_id: req.params.id,
        plan_template_id,
        assigned_by: req.profile.id,
        starts_at: starts.toISOString(),
        expires_at: expires.toISOString(),
        status: 'active',
      })
      .select('*, plan_template:plan_templates(*)')
      .single()

    if (error) throw error

    // Copiar items del template al user_plan (personalización)
    const { error: copyError } = await supabaseAdmin.rpc('copy_template_items_to_user_plan', {
      p_template_id: plan_template_id,
      p_user_plan_id: data.id,
    })

    if (copyError) {
      logger.error({ err: copyError }, 'failed to copy template items to user_plan')
      // No fallar la asignación si falla la copia, solo loguear
    }

    await supabaseAdmin
      .from('profiles')
      .update({ status: 'active', plan_expires_at: expires.toISOString() })
      .eq('id', req.params.id)

    await supabaseAdmin.from('admin_audit').insert({
      admin_id: req.profile.id,
      action: 'assign_plan',
      target_user_id: req.params.id,
      metadata: { plan_template_id, duration_days },
    })

    res.json({ user_plan: data })
  } catch (err) {
    logger.error({ err }, 'assign-plan failed')
    next(err)
  }
})

// Obtener items personalizados de un user_plan
router.get('/:id/user-plan-items', async (req, res, next) => {
  try {
    const { user_plan_id } = req.query
    
    if (!user_plan_id) {
      return res.status(400).json({ error: 'user_plan_id is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('plan_items')
      .select('*')
      .eq('user_plan_id', user_plan_id)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })
      .order('order_index', { ascending: true })

    if (error) {
      logger.error({ error, user_plan_id }, 'Failed to fetch user plan items')
      throw error
    }
    res.json({ items: data || [] })
  } catch (err) {
    logger.error({ err }, 'user-plan-items GET failed')
    next(err)
  }
})

// Actualizar un item personalizado
router.put('/user-plan-items/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params
    const { slot_name, foods, notes, week_number, day_of_week, order_index } = req.body

    const updateData = {}
    if (slot_name !== undefined) updateData.slot_name = slot_name
    if (foods !== undefined) updateData.foods = foods
    if (notes !== undefined) updateData.notes = notes
    if (week_number !== undefined) updateData.week_number = week_number
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week
    if (order_index !== undefined) updateData.order_index = order_index

    const { data, error } = await supabaseAdmin
      .from('plan_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      logger.error({ error, itemId }, 'Failed to update user plan item')
      throw error
    }
    res.json({ item: data })
  } catch (err) {
    logger.error({ err }, 'user-plan-items PUT failed')
    next(err)
  }
})

// Eliminar un item personalizado
router.delete('/user-plan-items/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params

    const { error } = await supabaseAdmin
      .from('plan_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// Agregar un nuevo item personalizado
router.post('/:id/user-plan-items', async (req, res, next) => {
  try {
    const { user_plan_id } = req.query
    const { slot_name, foods, notes, week_number, day_of_week, order_index } = req.body

    if (!user_plan_id) {
      return res.status(400).json({ error: 'user_plan_id is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('plan_items')
      .insert({
        user_plan_id,
        slot_name,
        foods: foods || [],
        notes,
        week_number,
        day_of_week,
        order_index: order_index || 0,
      })
      .select()
      .single()

    if (error) {
      logger.error({ error, user_plan_id, body: req.body }, 'Failed to insert user plan item')
      throw error
    }
    res.json({ item: data })
  } catch (err) {
    logger.error({ err }, 'user-plan-items POST failed')
    next(err)
  }
})

export default router
