import { z } from 'zod'

// Fixed vocabularies — mirrored by CHECK constraints in 009_recovery_breaks.sql.
export const ACTIVITIES = ['breathe', 'walk', 'stretch', 'water', 'music', 'quiet']
export const DURATIONS = [5, 10, 15]
export const TRIGGERS = ['latest_checkin', 'drain_pattern']
export const OUTCOMES = ['helped', 'a_little', 'not_really', 'skipped']

export const startBreakSchema = z.object({
  activity: z.string().refine(
    (val) => ACTIVITIES.includes(val) || /^custom:[0-9a-fA-F-]{36}$/.test(val),
    { message: 'Activity must be one of the built-in activities or custom:<uuid>' },
  ),
  durationMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  trigger: z.enum(TRIGGERS),
  checkinId: z.string().uuid().optional(),
})

export const breakIdSchema = z.object({
  id: z.string().uuid(),
})

export const outcomeSchema = z.object({
  outcome: z.enum(OUTCOMES),
})

export const createCustomActivitySchema = z.object({
  name: z.string().trim().min(1, 'Activity name is required').max(60, 'Name cannot exceed 60 characters'),
  hint: z.string().trim().max(120, 'Hint cannot exceed 120 characters').optional().default(''),
})

