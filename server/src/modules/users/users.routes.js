import { Router } from 'express'
import { requireUser } from '../../middleware/auth.js'
import { deleteMe, exportMe } from './users.controller.js'

export const usersRouter = Router()

// Account self-service requires an authenticated user. Deletion cascades
// to every user-owned row (check-ins, insights, reminders, analysis runs).
usersRouter.use(requireUser)
usersRouter.delete('/me', deleteMe)
usersRouter.get('/export', exportMe)

