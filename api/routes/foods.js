import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminOnly.js'
import { writeLimiter, writeSlowDown } from '../middleware/rateLimit.js'
import { supabaseAdmin } from '../config/supabase.js'

const router = Router()

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('foods')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    res.json({ foods: data })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, requireAdmin, writeLimiter, writeSlowDown, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('foods')
      .insert(req.body)
      .select()
      .single()
    if (error) throw error
    res.json({ food: data })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', requireAuth, requireAdmin, writeLimiter, writeSlowDown, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('foods')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ food: data })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, requireAdmin, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('foods')
      .delete()
      .eq('id', req.params.id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
