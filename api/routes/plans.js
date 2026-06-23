import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { writeLimiter, writeSlowDown } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { planTemplateSchema } from '../schemas/plan.schema.js'

const router = Router()

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('plan_templates')
      .select('*, plan_items(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    const items = (data || []).map((t) => ({
      ...t,
      plan_items: [...(t.plan_items || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    }))
    res.json({ templates: items })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, requireAdmin, writeLimiter, writeSlowDown, validate(planTemplateSchema), async (req, res, next) => {
  try {
    const { items, ...tpl } = req.body
    const { data: created, error } = await supabaseAdmin
      .from('plan_templates')
      .insert(tpl)
      .select()
      .single()
    if (error) throw error
    if (items?.length) {
      const rows = items.map((it, i) => ({
        plan_template_id: created.id,
        slot_name: it.slot_name,
        order_index: it.order_index ?? i,
        foods: it.foods || [],
        notes: it.notes || null,
      }))
      await supabaseAdmin.from('plan_items').insert(rows)
    }
    res.json({ template: created })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', requireAuth, requireAdmin, writeLimiter, writeSlowDown, validate(planTemplateSchema), async (req, res, next) => {
  try {
    const { items, ...tpl } = req.body
    const { data, error } = await supabaseAdmin
      .from('plan_templates')
      .update(tpl)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    await supabaseAdmin.from('plan_items').delete().eq('plan_template_id', req.params.id)
    if (items?.length) {
      const rows = items.map((it, i) => ({
        plan_template_id: req.params.id,
        slot_name: it.slot_name,
        order_index: it.order_index ?? i,
        foods: it.foods || [],
        notes: it.notes || null,
      }))
      await supabaseAdmin.from('plan_items').insert(rows)
    }
    res.json({ template: data })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, requireAdmin, writeLimiter, async (req, res, next) => {
  try {
    const { data: refs } = await supabaseAdmin
      .from('user_plans')
      .select('id')
      .eq('plan_template_id', req.params.id)
      .limit(1)
    if (refs?.length) {
      return res.status(409).json({ error: 'Plan tiene usuarios asignados, no se puede eliminar' })
    }
    await supabaseAdmin.from('plan_items').delete().eq('plan_template_id', req.params.id)
    const { error } = await supabaseAdmin.from('plan_templates').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
