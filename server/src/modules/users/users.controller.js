// HTTP only: read validated data, call the service, return responses.
// No SQL here, no business rules here.
import * as service from './users.service.js'
import { sendApiError, sourceFile } from '../../middleware/apiError.js'

const controllerFile = sourceFile(import.meta.url)

export async function getMe(req, res, next) {
  try {
    const profile = await service.getUserProfile(req.user.id)
    res.json({
      id: req.user.id,
      role: req.user.role || profile?.role || 'user',
      clerkSub: req.user.clerkSub || null,
      email: profile?.email ?? null,
      createdAt: profile?.created_at || null,
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteMe(req, res, next) {
  try {
    const deleted = await service.deleteUser(req.user.id)
    if (!deleted) {
      return sendApiError(req, res, {
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'That account was not found.',
        triggerFile: controllerFile,
        cause: { name: 'NotFoundError', code: 'USER_NOT_FOUND', message: 'Account was not found for this user.' },
      })
    }
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function exportMe(req, res, next) {
  try {
    const data = await service.exportUserData(req.user.id)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

