import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { env } from '../config/env.js'

const baseConfig = {
  windowMs: env.runtime.rateWindowMs,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
}

export const globalLimiter = rateLimit({
  ...baseConfig,
  max: env.runtime.rateMax,
  message: { error: 'Demasiadas solicitudes. Intenta en un momento.' },
})

export const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
})

export const writeLimiter = rateLimit({
  ...baseConfig,
  max: 30,
  message: { error: 'Demasiadas operaciones. Baja el ritmo.' },
})

export const writeSlowDown = slowDown({
  windowMs: 5 * 60 * 1000,
  delayAfter: 20,
  delayMs: () => 500,
})
