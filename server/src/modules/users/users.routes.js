import { Router } from 'express'
import { requireUser } from '../../middleware/auth.js'
import { deleteMe, exportMe, getMe } from './users.controller.js'
import { withController } from '../../middleware/withController.js'

export const usersRouter = Router()

// Account self-service requires an authenticated user. Deletion cascades
// to every user-owned row (check-ins, insights, reminders, analysis runs).
usersRouter.use(requireUser)
usersRouter.get('/me', withController('users.getMe', getMe))
usersRouter.delete('/me', withController('users.deleteMe', deleteMe))
usersRouter.get('/export', withController('users.exportMe', exportMe))

