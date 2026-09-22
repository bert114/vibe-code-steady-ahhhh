// Cloudflare Workers AI adapter (REST, server-side only).
// Swappable: ai.service depends on the runAnalysis() signature, not on this
// provider. Throws ProviderError with a SAFE code — never the raw body,
// which could echo user content into logs.

export class ProviderError extends Error {
  constructor(code) {
    super(`AI provider failed: ${code}`)
    this.name = 'ProviderError'
    this.code = code
  }
}

function timeoutMs() {
  return Number(process.env.AI_PROVIDER_TIMEOUT_MS ?? 20000)
}

export async function runAnalysis({ system, user }) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  const model = process.env.CLOUDFLARE_AI_MODEL
  if (!accountId || !apiToken || !model) {
    throw new ProviderError('AI_NOT_CONFIGURED')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs())
  let res
  try {
    res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      },
    )
  } catch (err) {
    throw new ProviderError(err?.name === 'AbortError' ? 'AI_TIMEOUT' : 'AI_NETWORK_ERROR')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    throw new ProviderError(res.status === 429 ? 'AI_QUOTA_EXCEEDED' : 'AI_REQUEST_FAILED')
  }

  let body
  try {
    body = await res.json()
  } catch {
    throw new ProviderError('AI_BAD_RESPONSE')
  }

  // Workers AI returns { result: { response: "..." } } for chat models.
  const text = body?.result?.response ?? body?.result?.text ?? null
  if (typeof text !== 'string' || text.length === 0) {
    throw new ProviderError('AI_EMPTY_RESPONSE')
  }
  return text
}
