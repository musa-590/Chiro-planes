import 'dotenv/config'

const required = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
]

const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '))
  console.error('Copy .env.example to .env and fill values.')
  process.exit(1)
}

export const env = {
  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },
  smtp: {
    fromEmail: process.env.SMTP_FROM_EMAIL,
    fromName: process.env.SMTP_FROM_NAME || 'Chiro Shimokawa',
  },
  runtime: {
    nodeEnv: process.env.NODE_ENV || 'development',
    rateWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    rateMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS) || 8000,
    publicUrl: process.env.VITE_PUBLIC_URL || 'http://localhost:5173',
  },
}
