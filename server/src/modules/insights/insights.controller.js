// HTTP only: read validated data, call services, return responses.
// No SQL here, no business rules here.
import { z } from 'zod'
import {
  analyzeRecentCheckins,
  getInsightById,
  getLatestInsights,
} from '../../services/ai/ai.service.js'
import { analyzeUserPatterns } from '../../services/patterns/pattern.service.js'

const insightIdSchema = z.object({ id: z.string().uuid() })

export async function getSignals(req, res, next) {
  try {
    res.json(await analyzeUserPatterns(req.user.id))
  } catch (err) {
    next(err)
  }
}

export async function postAnalyze(req, res, next) {
  try {
    res.status(202).json(await analyzeRecentCheckins(req.user.id))
  } catch (err) {
    next(err)
  }
}

export async function getInsights(req, res, next) {
  try {
    res.json({ insights: await getLatestInsights(req.user.id) })
  } catch (err) {
    next(err)
  }
}

export async function getInsightByIdController(req, res, next) {
  try {
    const parsed = insightIdSchema.safeParse(req.params)
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'The request could not be validated.', details: [] },
      })
    }
    const insight = await getInsightById(req.user.id, parsed.data.id)
    if (!insight) {
      return res.status(404).json({
        error: { code: 'INSIGHT_NOT_FOUND', message: 'That insight was not found.', details: [] },
      })
    }
    res.json(insight)
  } catch (err) {
    next(err)
  }
}
