import { describe, expect, it } from 'vitest'
import cases from '../../../../e2e/ai-fixtures/cases.json' with { type: 'json' }
import { parseAiResult } from './outputSchema.js'

// Language screen: well-formed output must still avoid diagnosing,
// commanding, or third-party-labeling language. Mirrors the prompt rules.
const FORBIDDEN = /\b(diagnos\w*|disorder|clinical|you must|toxic|narcissist)\b/i

function screenLanguage(data) {
  const texts = [
    ...data.insights.flatMap((i) => [i.title, i.summary, ...(i.suggestions ?? [])]),
    data.reminder?.message ?? '',
  ]
  return texts.filter((t) => FORBIDDEN.test(t))
}

describe('ai output contract (no db)', () => {
  it('accepts the well-formed eval cases', () => {
    for (const c of cases.cases.filter((x) => x.expect === 'accepted')) {
      const result = parseAiResult(c.providerOutput)
      expect(result.ok, c.name).toBe(true)
    }
  })

  it('rejects malformed JSON and schema violations with safe codes', () => {
    const malformed = cases.cases.find((c) => c.name === 'malformed-ai-json')
    expect(parseAiResult(malformed.providerOutput)).toEqual({
      ok: false,
      errorCode: 'AI_MALFORMED_JSON',
    })
    const violation = cases.cases.find((c) => c.name === 'schema-violation')
    expect(parseAiResult(violation.providerOutput).ok).toBe(false)
    expect(parseAiResult(violation.providerOutput).errorCode).toBe('AI_SCHEMA_REJECTED')
  })

  it('flags unsafe language in the adversarial case', () => {
    const adversarial = cases.cases.find((c) => c.name === 'unsafe-language')
    const parsed = parseAiResult(adversarial.providerOutput)
    expect(parsed.ok).toBe(true) // shape is fine…
    expect(screenLanguage(parsed.data).length).toBeGreaterThan(0) // …but language is not
  })

  it('finds no forbidden language in the accepted cases', () => {
    for (const c of cases.cases.filter((x) => x.expect === 'accepted')) {
      const parsed = parseAiResult(c.providerOutput)
      expect(screenLanguage(parsed.data), c.name).toEqual([])
    }
  })
})
