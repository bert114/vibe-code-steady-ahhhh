// HTTP only: read validated data, call the service, return responses.
// No SQL here, no business rules here.
import * as service from './users.service.js'

export async function deleteMe(req, res, next) {
  try {
    const deleted = await service.deleteUser(req.user.id)
    if (!deleted) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'That account was not found.',
          details: [],
        },
      })
    }
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
