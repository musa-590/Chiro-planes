import pino from 'pino'
import { env } from '../config/env.js'

export const logger = pino({
  level: env.runtime.nodeEnv === 'production' ? 'info' : 'debug',
  transport: env.runtime.nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined,
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secret'],
})
