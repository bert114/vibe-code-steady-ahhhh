import { Router } from 'express'
import { requireUser } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { getReminders, patchReminderRead } from './reminders.controller.js'
import { listRemindersSchema, reminderIdSchema } from './reminders.validation.js'

export const remindersRouter = Router()

// All reminder routes require an authenticated user (dev bypass in local dev,
// real auth before the external beta). Local reads/writes only — no limiter.
remindersRouter.use(requireUser)
remindersRouter.get('/', validate(listRemindersSchema, 'query'), getReminders)
remindersRouter.patch('/:id/read', validate(reminderIdSchema, 'params'), patchReminderRead)
