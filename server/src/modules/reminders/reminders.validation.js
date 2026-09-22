import { z } from 'zod'

export const listRemindersSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
})

export const reminderIdSchema = z.object({
  id: z.string().uuid(),
})
