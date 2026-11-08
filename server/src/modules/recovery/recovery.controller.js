// HTTP only: read validated data, call the service, return responses.
// No SQL here, no business rules here.
import * as service from './recovery.service.js'

function notFound(res, code, message) {
  return res.status(404).json({ error: { code, message, details: [] } })
}

export async function getState(req, res, next) {
  try {
    res.json(await service.getRecoveryState(req.user.id))
  } catch (err) {
    next(err)
  }
}

export async function postBreak(req, res, next) {
  try {
    const result = await service.startBreak(req.user.id, req.body)
    if (result.notFound) {
      return notFound(res, 'CHECKIN_NOT_FOUND', 'That check-in was not found.')
    }
    res.status(result.created ? 201 : 200).json(result.break)
  } catch (err) {
    next(err)
  }
}

export async function patchOutcome(req, res, next) {
  try {
    const answered = await service.answerBreak(req.user.id, req.params.id, req.body.outcome)
    if (!answered) {
      return notFound(res, 'BREAK_NOT_FOUND', 'That break was not found.')
    }
    res.json(answered)
  } catch (err) {
    next(err)
  }
}

export async function postCustomActivity(req, res, next) {
  try {
    const activity = await service.createCustomActivity(req.user.id, req.body)
    res.status(201).json(activity)
  } catch (err) {
    next(err)
  }
}

export async function listCustomActivities(req, res, next) {
  try {
    const activities = await service.getCustomActivities(req.user.id)
    res.json(activities)
  } catch (err) {
    next(err)
  }
}

