import { verifyToken } from '../utils/auth.js'
import { supabaseAdmin } from '../config/supabase.js'
import { logger } from '../utils/logger.js'

export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  const token = auth.slice(7)
  try {
    const user = await verifyToken(token)
    if (!user) return res.status(401).json({ error: 'Sesion invalida' })

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role, status, full_name, email')
      .eq('id', user.id)
      .single()

    if (error || !profile) return res.status(401).json({ error: 'Perfil no encontrado' })

    req.user = user
    req.profile = profile
    next()
  } catch (err) {
    logger.error({ err }, 'auth middleware failed')
    res.status(401).json({ error: 'Sesion invalida' })
  }
}
