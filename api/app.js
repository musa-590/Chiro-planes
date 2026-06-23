import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import { env } from './config/env.js'
import { globalLimiter } from './middleware/rateLimit.js'
import { requestTimeout } from './middleware/timeout.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'
import usersRouter from './routes/users.js'
import foodsRouter from './routes/foods.js'
import plansRouter from './routes/plans.js'
import metricsRouter from './routes/metrics.js'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", env.supabase.url, 'https://*.supabase.co'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))

app.use(cors({
  origin: env.runtime.publicUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use(compression({ threshold: 1024 }))

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: false, limit: '10kb' }))

app.use(requestTimeout)
app.use(globalLimiter)

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

app.use('/api/users', usersRouter)
app.use('/api/foods', foodsRouter)
app.use('/api/plans', plansRouter)
app.use('/api/metrics', metricsRouter)

app.use(notFound)
app.use(errorHandler)

export default app
