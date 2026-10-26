// HTTP only: read validated data, call services, return responses.
// No SQL here, no business rules here.
import {
  analyzeRecentCheckins,
  getInsightById,
  getLatestInsights,
} from "../../services/ai/ai.service.js";
import { analyzeUserPatterns } from "../../services/patterns/pattern.service.js";

export async function getSignals(req, res, next) {
  try {
    const result = await analyzeUserPatterns(req.user.id);
    // Audit enrichment (safe counts/types only — never raw notes).
    if (req.audit) {
      req.audit.produced = {
        windowDays: result.windowDays,
        checkinsConsidered: result.checkinsConsidered,
        signals: result.signals.length,
        signalTypes: result.signals.map((s) => s?.type).filter(Boolean).slice(0, 10),
      };
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function postAnalyze(req, res, next) {
  try {
    const result = await analyzeRecentCheckins(req.user.id);
    // Audit enrichment: what the analysis produced (counts/flags only).
    // What was sent externally is logged by the AI provider itself.
    if (req.audit) {
      req.audit.produced = {
        insights: result.insights?.length ?? 0,
        fallback: Boolean(result.fallback),
        fresh: result.fresh,
        hasLastInsight: Boolean(result.lastInsight),
        messageChars: typeof result.message === 'string' ? result.message.length : 0,
      };
    }
    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getInsights(req, res, next) {
  try {
    res.json({ insights: await getLatestInsights(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export async function getInsightByIdHandler(req, res, next) {
  try {
    const insight = await getInsightById(req.user.id, req.params.id);
    if (!insight) {
      return res.status(404).json({
        error: {
          code: "INSIGHT_NOT_FOUND",
          message: "That insight was not found.",
          details: [],
        },
      });
    }
    res.json(insight);
  } catch (err) {
    next(err);
  }
}
