import { logger } from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  logger.error({ err: { message: err.message, stack: err.stack }, path: req.path }, 'unhandled error')
  if (res.headersSent) return next(err)
  const status = err.status || 500
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message,
  })
}

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' })
}
