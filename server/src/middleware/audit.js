// Per-request audit to console JSON (TEMP-OPEN-ACCESS companion).
// Answers "when making a req, what is produced and what is sent" with SAFE
// metadata only: method, path, status, timing, user id, field names, counts,
// lengths, ids, provider codes. NEVER raw check-in notes, emotions values,
// full AI prompts/output, tokens, or connection strings.
//
// Wiring: app.use(audit) right after express.json, before auth. Controllers
// and services can add workflow detail via req.audit.produced /
// req.audit.sentExternally — the finish hook merges and logs once.
//
// Disable with AUDIT_ENABLED=false (tests do this).
import { env } from '../config/env.js'

let seq = 0

function safeBodySummary(body) {
  if (body == null || typeof body !== 'object') return undefined
  const keys = Object.keys(body)
  const summary = { fields: keys }
  // Lengths/counts only — never values.
  if (typeof body.note === 'string') summary.noteChars = body.note.length
  if (Array.isArray(body.emotions)) summary.emotionsCount = body.emotions.length
  if (Array.isArray(body.context_tags)) summary.contextTagsCount = body.context_tags.length
  if (Array.isArray(body.tags)) summary.tagsCount = body.tags.length
  return summary
}

function safeQuerySummary(query) {
  if (query == null || typeof query !== 'object') return undefined
  const keys = Object.keys(query)
  if (keys.length === 0) return undefined
  // Keys + scalar values for paging/window filters are safe; note text never
  // travels in query, so values here are low-risk. Keep it minimal anyway.
  const allowValues = new Set(['limit', 'offset', 'windowDays', 'window'])
  const values = {}
  for (const k of keys) {
    if (allowValues.has(k)) values[k] = query[k]
  }
  return { keys, ...(Object.keys(values).length ? { values } : {}) }
}

function summarizeResponseBody(body) {
  if (body == null || typeof body !== 'object') return undefined
  const summary = {}
  if (Array.isArray(body.checkins)) {
    summary.checkins = body.checkins.length
    if (body.checkins[0]?.id) summary.firstId = body.checkins[0].id
  }
  if (Array.isArray(body.insights)) {
    summary.insights = body.insights.length
    if (body.insights[0]?.id) summary.firstId = body.insights[0].id
  }
  if (Array.isArray(body.signals)) {
    summary.signals = body.signals.length
    summary.signalTypes = body.signals.map((s) => s?.type).filter(Boolean).slice(0, 10)
  }
  if (Array.isArray(body.days)) summary.days = body.days.length
  if (typeof body.totalCheckins === 'number') summary.totalCheckins = body.totalCheckins
  if (Array.isArray(body.topDrainingTags)) summary.topDrainingTags = body.topDrainingTags.length
  if (typeof body.fallback === 'boolean') summary.fallback = body.fallback
  if (typeof body.fresh === 'boolean') summary.fresh = body.fresh
  if (typeof body.message === 'string') summary.messageChars = body.message.length
  if (body.data && typeof body.data === 'object') {
    summary.data = { keys: Object.keys(body.data) }
    if (body.data.id) summary.data.id = body.data.id
    if (typeof body.data.deleted === 'boolean') summary.data.deleted = body.data.deleted
  }
  if (body.error && typeof body.error === 'object') {
    summary.errorCode = body.error.code
  }
  if (body.exportedAt) summary.exported = true
  return Object.keys(summary).length ? summary : { keys: Object.keys(body).slice(0, 10) }
}

export function audit(req, res, next) {
  if (!env.AUDIT_ENABLED) return next()
  const id = `${Date.now().toString(36)}-${(seq += 1)}`
  const start = Date.now()
  req.audit = req.audit ?? { produced: {}, sentExternally: null }
  if (!req.audit.produced) req.audit.produced = {}

  const reqMeta = {
    keys: req.query ? Object.keys(req.query) : [],
    bodyFields: req.body && typeof req.body === 'object' ? Object.keys(req.body) : [],
  }

  // Capture res.json payloads for the response summary without changing behavior.
  const originalJson = res.json.bind(res)
  let responseSummary
  res.json = (body) => {
    try {
      responseSummary = summarizeResponseBody(body)
    } catch {
      responseSummary = undefined
    }
    return originalJson(body)
  }

  res.on('finish', () => {
    // Read user late: authResolver/requireUser run after this middleware.
    const userId = req.user?.id ?? null
    const entry = {
      audit: true,
      id,
      ts: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userId,
      openAccess: Boolean(req.user?.openAccess) || env.OPEN_ACCESS,
      query: safeQuerySummary(req.query),
      body: safeBodySummary(req.body),
      reqMeta,
      status: res.statusCode,
      durationMs: Date.now() - start,
      produced: req.audit?.produced && Object.keys(req.audit.produced).length ? req.audit.produced : responseSummary,
      sentExternally: req.audit?.sentExternally ?? undefined,
    }
    // Single line, safe to grep: [audit] {"audit":true,...}
    console.log(`[audit] ${JSON.stringify(entry)}`)
  })

  next()
}
