import { z } from 'zod'

export const insightIdSchema = z.object({
  id: z.string().uuid(),
})
