import { Router } from 'express'
import { requireUser } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { getState, listCustomActivities, patchOutcome, postBreak, postCustomActivity } from './recovery.controller.js'
import { breakIdSchema, createCustomActivitySchema, outcomeSchema, startBreakSchema } from './recovery.validation.js'

export const recoveryRouter = Router()

// Optional recovery breaks offered by Steady Mind when a user is drained.
// All routes are scoped to the authenticated user.
recoveryRouter.use(requireUser)
recoveryRouter.get('/state', getState)
recoveryRouter.get('/activities', listCustomActivities)
recoveryRouter.post('/activities', validate(createCustomActivitySchema, 'body'), postCustomActivity)
recoveryRouter.post('/breaks', validate(startBreakSchema, 'body'), postBreak)
recoveryRouter.patch(
  '/breaks/:id/outcome',
  validate(breakIdSchema, 'params'),
  validate(outcomeSchema, 'body'),
  patchOutcome,
)

