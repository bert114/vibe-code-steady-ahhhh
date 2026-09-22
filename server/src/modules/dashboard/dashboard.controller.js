// HTTP only: call the service, return the response.
// No SQL here, no business rules here.
import { getDashboardSummary } from './dashboard.service.js'

export async function getSummary(req, res, next) {
  try {
    res.json(await getDashboardSummary(req.user.id))
  } catch (err) {
    next(err)
  }
}
