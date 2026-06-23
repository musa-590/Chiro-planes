import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminOnly.js'
import { logger } from '../utils/logger.js'

const router = Router()

router.get('/:id/metrics', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('body_metrics')
      .select('*')
      .eq('user_id', req.params.id)
      .order('recorded_at', { ascending: true })
    if (error) throw error
    res.json({ metrics: data })
  } catch (err) {
    next(err)
  }
})

export default router
