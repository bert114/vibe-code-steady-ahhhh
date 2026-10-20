import { Router } from 'express'
import { requireUser } from '../../middleware/auth.js'
import { withController } from '../../middleware/withController.js'
import { getSummary } from './dashboard.controller.js'

export const dashboardRouter = Router()

// Single authenticated read; aggregation is local computation — no limiter.
dashboardRouter.use(requireUser)
dashboardRouter.get(
  '/summary',
  withController('dashboard.getSummary', getSummary),
)
