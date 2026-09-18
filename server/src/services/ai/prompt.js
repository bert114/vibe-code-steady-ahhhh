// Prompt construction for the insight analysis call.
// The model ONLY rephrases deterministic evidence — it never classifies,
// diagnoses, or decides. Notes are included only when present and always
// truncated to the configured input budget.

const SYSTEM_RULES = `You explain a user's own wellness check-in patterns in plain, supportive language.

Strict rules:
- Describe observations as observations. Never present anything as a medical or psychological diagnosis.
- State uncertainty when evidence is weak ("might", "could", "seems").
- Never tell the user what they must do; suggestions stay optional and supportive.
- Never judge or label other people.
- Use ONLY the data provided. Never invent events, dates, or evidence.
- When evidence is thin, say so plainly instead of stretching.
- Return ONLY JSON matching this shape, no other text:
{"insights": [{"type": "pattern|burnout|boundary|general", "title": "...", "summary": "...", "evidence": ["..."], "confidence": "low|medium|high", "suggestions": ["..."]}], "reminder": {"shouldShow": true|false, "message": "..."} or null}`

function maxInputChars() {
  return Number(process.env.AI_MAX_INPUT_CHARS ?? 4000)
}

function summarizeCheckin(c) {
  const parts = [
    `mood ${c.mood_score}/5`,
    `energy ${c.energy_score}/5`,
    `drain ${c.drain_score}/5`,
  ]
  if (c.emotions?.length) parts.push(`feelings: ${c.emotions.join(', ')}`)
  if (c.context_tags?.length) parts.push(`context: ${c.context_tags.join(', ')}`)
  if (c.note) parts.push(`note: ${c.note}`)
  return `- ${c.occurred_at}: ${parts.join('; ')}`
}

export function buildAnalysisPrompt({ checkins, signals, aggregates }) {
  const userPayload = JSON.stringify({ checkins: checkins.map(summarizeCheckin), signals, aggregates })
  const budget = maxInputChars()
  const trimmed =
    userPayload.length > budget ? `${userPayload.slice(0, budget)}…[truncated]` : userPayload

  return {
    system: SYSTEM_RULES,
    user: `Here is the user's recent check-in data and the pattern signals our rules found:\n${trimmed}\nExplain what stands out, following your rules.`,
  }
}
