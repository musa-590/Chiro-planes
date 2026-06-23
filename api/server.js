import app from './app.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'

const port = process.env.PORT || 3001

const server = app.listen(port, () => {
  logger.info({ port, env: env.runtime.nodeEnv }, 'API listening')
})

const shutdown = (sig) => {
  logger.info({ sig }, 'shutting down')
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
