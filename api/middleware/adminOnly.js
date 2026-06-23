import { ROLES } from '../utils/roles.js'

export const requireAdmin = (req, res, next) => {
  if (req.profile?.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Acceso solo para administradores' })
  }
  next()
}
