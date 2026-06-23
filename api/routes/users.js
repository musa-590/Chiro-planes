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

export default router
