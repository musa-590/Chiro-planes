import { z } from 'zod'

export const assignPlanSchema = z.object({
  plan_template_id: z.string().uuid(),
  duration_days: z.number().int().min(1).max(365),
})
