import { z } from 'zod'

// Scores follow the 3-option check-in UI: only 1, 3, or 5 are accepted.
// The scale itself stays 1-5 so existing history remains valid and the
// pattern engine thresholds (low <= 2, high >= 4) keep classifying
// correctly (1 = low, 3 = neutral, 5 = high). The DB CHECK constraints
// enforce the same allowlist — never trust a single layer.
const score = z
  .number()
  .int()
  .refine((v) => v === 1 || v === 3 || v === 5, {
    message: 'Score must be one of 1, 3, or 5.',
  })
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
