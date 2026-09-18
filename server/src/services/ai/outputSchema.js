import { z } from 'zod'

// Structured-output contract for the AI analysis result. Anything that does
// not parse is rejected and triggers the neutral fallback — malformed model
// output is never stored and never shown.
const insightSchema = z.object({
  type: z.enum(['pattern', 'burnout', 'boundary', 'general']),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(2000),
  evidence: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
  confidence: z.enum(['low', 'medium', 'high']),
  suggestions: z.array(z.string().trim().min(1).max(500)).max(5).default([]),
})

export const aiResultSchema = z.object({
  insights: z.array(insightSchema).min(1).max(5),
  reminder: z
    .object({
      shouldShow: z.boolean(),
      message: z.string().trim().max(500).default(''),
    })
    .nullable()
    .default(null),
})

// Parses a raw model string (expected JSON). Returns { ok, data | issues } —
// never throws, so the caller can fall back uniformly.
export function parseAiResult(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, errorCode: 'AI_MALFORMED_JSON' }
  }
  const result = aiResultSchema.safeParse(parsed)
  if (!result.success) {
    return { ok: false, errorCode: 'AI_SCHEMA_REJECTED' }
  }
  return { ok: true, data: result.data }
}
