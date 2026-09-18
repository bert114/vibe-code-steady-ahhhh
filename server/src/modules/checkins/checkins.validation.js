import { z } from 'zod'

// Scores follow the TechDesign proposal (1-5). The DB CHECK constraints
// enforce the same range — never trust a single layer.
const score = z.number().int().min(1).max(5)
const tagList = z.array(z.string().trim().min(1).max(40)).max(20).default([])

export const createCheckinSchema = z.object({
  occurred_at: z.string().datetime({ offset: true }).optional(),
  mood_score: score,
  energy_score: score,
  drain_score: score,
  emotions: tagList,
  context_tags: tagList,
  note: z.string().max(5000).default(''),
})

export const listCheckinsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
})

export const checkinIdSchema = z.object({
  id: z.string().uuid(),
})
