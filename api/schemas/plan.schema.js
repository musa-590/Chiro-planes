import { z } from 'zod'

export const planItemFoodSchema = z.object({
  id: z.string().uuid(),
  qty: z.number().min(0).max(10000),
  unit: z.enum(['u', 'g', 'kg', 'ml']),
})

export const planItemSchema = z.object({
  week_number: z.number().int().min(1).max(52).optional().default(1),
  day_of_week: z.number().int().min(1).max(7).optional().default(1),
  slot_name: z.string().min(1).max(100),
  order_index: z.number().int().min(0).optional(),
  foods: z.array(planItemFoodSchema).optional().default([]),
  notes: z.string().max(500).optional().nullable(),
})

export const planTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  duration_days: z.number().int().min(1).max(365),
  price: z.number().min(0).max(99_999),
  is_active: z.boolean().optional().default(true),
  items: z.array(planItemSchema).optional().default([]),
})
