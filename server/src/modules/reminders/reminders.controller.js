// HTTP only: read validated data, call the service, return responses.
// No SQL here, no business rules here.
import * as service from './reminders.service.js'

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
      return res.status(404).json({
        error: {
          code: 'REMINDER_NOT_FOUND',
          message: 'That reminder was not found.',
          details: [],
        },
      })
    }
    res.json(reminder)
  } catch (err) {
    next(err)
  }
}
