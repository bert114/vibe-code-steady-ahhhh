// HTTP only: read validated data, call the service, return responses.
// No SQL here, no business rules here.
import * as service from './reminders.service.js'
import { sendApiError, sourceFile } from '../../middleware/apiError.js'

const controllerFile = sourceFile(import.meta.url)

export async function getReminders(req, res, next) {
  try {
    const reminders = await service.getReminders(req.user.id, req.query)
    res.json({ reminders })
  } catch (err) {
    next(err)
  }
}

export async function patchReminderRead(req, res, next) {
  try {
    const reminder = await service.markReminderRead(req.user.id, req.params.id)
    if (!reminder) {
      return sendApiError(req, res, {
        status: 404,
        code: 'REMINDER_NOT_FOUND',
        message: 'That reminder was not found.',
        triggerFile: controllerFile,
        cause: { name: 'NotFoundError', code: 'REMINDER_NOT_FOUND', message: 'Reminder was not found for this user.' },
      })
    }
    res.json(reminder)
  } catch (err) {
    next(err)
  }
}
