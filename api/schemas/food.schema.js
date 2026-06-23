import { z } from 'zod'

export const foodSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  image_url: z.string().url().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
})
