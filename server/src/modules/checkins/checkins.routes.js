import { Router } from 'express'
import { requireUser } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import {
  getCheckinById,
  getCheckins,
  postCheckin,
} from './checkins.controller.js'
import {
  checkinIdSchema,
  createCheckinSchema,
  listCheckinsSchema,
} from './checkins.validation.js'

export const checkinsRouter = Router()

// All check-in routes require an authenticated user (dev bypass in local dev,
// real auth before the external beta).
checkinsRouter.use(requireUser)
checkinsRouter.post('/', validate(createCheckinSchema, 'body'), postCheckin)
checkinsRouter.get('/', validate(listCheckinsSchema, 'query'), getCheckins)
checkinsRouter.get('/:id', validate(checkinIdSchema, 'params'), getCheckinById)
