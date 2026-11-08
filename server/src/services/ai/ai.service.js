// Analysis orchestration: deterministic evidence in, validated insight out.
// Flow: load window -> pattern engine -> skip if nothing new -> provider ->
// validate -> persist -> return. Any failure lands on the neutral fallback;
// check-ins are never blocked and raw content never reaches logs.
import { env } from '../../config/env.js'
import { listCheckins } from '../../modules/checkins/checkins.repository.js'
import { analyzeUserPatterns } from '../patterns/pattern.service.js'
import { ProviderError, runAnalysis as cloudflareRun } from './cloudflare.provider.js'
import { runAnalysis as groqRun } from './groq.provider.js'
import { runAnalysis as openaiRun } from './openai.provider.js'
import { buildAnalysisPrompt } from './prompt.js'
import { parseAiResult } from './outputSchema.js'
import * as repository from '../../modules/insights/insights.repository.js'

export const FALLBACK_MESSAGE = 'Insights are temporarily unavailable.'

function resolveProvider() {
  const explicit = process.env.AI_PROVIDER
  if (explicit === 'groq') return { provider: 'groq', model: env.GROQ_MODEL, run: groqRun }
  if (explicit === 'openai') return { provider: 'openai', model: env.OPENAI_MODEL, run: openaiRun }
  if (explicit === 'cloudflare') {
    return { provider: 'cloudflare', model: env.CLOUDFLARE_AI_MODEL, run: cloudflareRun }
  }
  if (process.env.GROQ_API_KEY || env.GROQ_API_KEY) {
    return { provider: 'groq', model: env.GROQ_MODEL, run: groqRun }
  }
  if (process.env.OPENAI_API_KEY || env.OPENAI_API_KEY) {
    return { provider: 'openai', model: env.OPENAI_MODEL, run: openaiRun }
  }
  return { provider: env.AI_PROVIDER, model: env.CLOUDFLARE_AI_MODEL, run: cloudflareRun }
}

function aggregatesFor(rows) {
  if (rows.length === 0) return null
  const avg = (key) => rows.reduce((n, r) => n + r[key], 0) / rows.length
  return {
    checkins: rows.length,
    avgMood: round1(avg('mood_score')),
    avgEnergy: round1(avg('energy_score')),
    avgDrain: round1(avg('drain_score')),
  }
}

function round1(n) {
  return Math.round(n * 10) / 10
}

async function lastStoredInsight(userId) {
  const [latest] = await repository.listInsights(userId, 1)
  return latest ?? null
}

function fallbackResult(lastInsight, errorCode) {
  // errorCode is logged by the caller, never shown.
  return { insights: [], lastInsight, fallback: true, message: FALLBACK_MESSAGE, errorCode }
}

export async function analyzeRecentCheckins(userId, deps = {}) {
  const resolved = resolveProvider()
  const runProvider = deps.provider ?? resolved.run
  const { provider, model } = resolved

  const rows = await listCheckins(userId, { limit: 100, offset: 0 })
  if (rows.length === 0) {
    return {
      insights: [],
      lastInsight: await lastStoredInsight(userId),
      fallback: true,
      message: 'Not enough check-ins yet — record a few and try again.',
    }
  }

  const latestCheckinAt = rows.reduce(
    (max, r) => (r.occurred_at > max ? r.occurred_at : max),
    rows[0].occurred_at,
  )
  const lastRun = await repository.getLastCompletedRun(userId)
  if (lastRun?.latest_checkin_at && lastRun.latest_checkin_at >= latestCheckinAt) {
    const stored = await repository.listInsights(userId, 10)
    return { insights: stored, lastInsight: stored[0] ?? null, fallback: false, fresh: false }
  }

  const analysis = await analyzeUserPatterns(userId)
  const run = await repository.startRun(userId, {
    inputCheckinCount: rows.length,
    latestCheckinAt,
    provider,
    model,
  })

  let raw
  try {
    const prompt = buildAnalysisPrompt({
      checkins: rows,
      signals: analysis.signals,
      aggregates: aggregatesFor(rows),
    })
    raw = await runProvider(prompt)
  } catch (err) {
    const code = err instanceof ProviderError ? err.code : 'AI_UNKNOWN_ERROR'
    await repository.completeRun(run.id, code)
    console.error(`[ai] analyze failed for run ${run.id} (${code})`)
    return fallbackResult(await lastStoredInsight(userId), code)
  }

  const parsed = parseAiResult(raw)
  if (!parsed.ok) {
    await repository.completeRun(run.id, parsed.errorCode)
    console.error(`[ai] analyze failed for run ${run.id} (${parsed.errorCode})`)
    return fallbackResult(await lastStoredInsight(userId), parsed.errorCode)
  }

  const stored = []
  for (const insight of parsed.data.insights) {
    // eslint-disable-next-line no-await-in-loop
    stored.push(await repository.insertInsight(userId, run.id, insight))
  }
  const reminder = parsed.data.reminder
  // insight_id stays null when the model honestly returned no insights —
  // the reminder (e.g. "record a few more check-ins") is still worth keeping.
  if (reminder?.shouldShow && reminder.message) {
    await repository.insertReminder(userId, stored[0]?.id ?? null, 'insight', reminder.message)
  }
  await repository.completeRun(run.id)
  try {
    if (process.env.AUDIT_ENABLED !== 'false') {
      console.log(
        `[audit] ${JSON.stringify({ audit: true, kind: 'ai-analyze-ok', runId: run.id, provider, stored: stored.length })}`,
      )
    }
  } catch {
    // Auditing must never break the analysis result.
  }
  return { insights: stored, lastInsight: stored[0] ?? null, fallback: false, fresh: true }
}

export const getLatestInsights = (userId) => repository.listInsights(userId, 10)
export const getInsightById = (userId, id) => repository.findInsightById(userId, id)
