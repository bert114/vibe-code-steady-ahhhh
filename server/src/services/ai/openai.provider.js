// OpenAI adapter (REST, server-side only).
// Swappable: ai.service depends on the runAnalysis() signature, not on this
// provider. Throws ProviderError with a SAFE code — never the raw body,
// which could echo user content into logs.
import { ProviderError } from './cloudflare.provider.js'

function timeoutMs() {
  return Number(process.env.AI_PROVIDER_TIMEOUT_MS ?? 20000)
}

export function openaiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  }
}

export async function runAnalysis({ system, user }) {
  const { apiKey, model } = openaiConfig()
  if (!apiKey) {
    throw new ProviderError('AI_NOT_CONFIGURED')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs())
  let res
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })
  } catch (err) {
    throw new ProviderError(err?.name === 'AbortError' ? 'AI_TIMEOUT' : 'AI_NETWORK_ERROR')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    if (res.status === 429) throw new ProviderError('AI_QUOTA_EXCEEDED')
    if (res.status === 401 || res.status === 403) throw new ProviderError('AI_UNAUTHORIZED')
    throw new ProviderError('AI_REQUEST_FAILED')
  }

  let body
  try {
    body = await res.json()
  } catch {
    throw new ProviderError('AI_BAD_RESPONSE')
  }

  // Chat Completions returns { choices: [{ message: { content: "..." } }] }.
  const text = body?.choices?.[0]?.message?.content ?? null
  if (typeof text !== 'string' || text.length === 0) {
    throw new ProviderError('AI_EMPTY_RESPONSE')
  }
  return text
}
