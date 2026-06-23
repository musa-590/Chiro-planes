import timeout from 'express-timeout-handler'
import { env } from '../config/env.js'

export const requestTimeout = timeout.handler({
  timeout: env.runtime.requestTimeoutMs,
  onTimeout: (req, res) => {
    res.status(408).json({ error: 'La solicitud tomo demasiado tiempo' })
  },
})
