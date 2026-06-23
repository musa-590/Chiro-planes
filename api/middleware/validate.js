import { ZodError } from 'zod'

export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const data = schema.parse(req[source])
    req[source] = data
    next()
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      return res.status(400).json({ error: `Datos invalidos - ${issues}` })
    }
    next(err)
  }
}
