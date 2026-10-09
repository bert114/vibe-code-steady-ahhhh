import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProviderError } from './cloudflare.provider.js'
import { runAnalysis } from './groq.provider.js'

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.GROQ_API_KEY
  delete process.env.GROQ_MODEL
})

function okResponse(content) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function failsWith(promise, code) {
  await expect(promise).rejects.toBeInstanceOf(ProviderError)
  await expect(promise).rejects.toMatchObject({ code })
}

describe('groq provider (no network)', () => {
  it('refuses without a key before touching the network', async () => {
    const calls = []
    vi.stubGlobal('fetch', (...args) => {
      calls.push(args)
      return Promise.resolve(okResponse('{}'))
    })
    await failsWith(runAnalysis({ system: 's', user: 'u' }), 'AI_NOT_CONFIGURED')
    expect(calls).toHaveLength(0)
  })

  it('posts chat completions with structured JSON output and returns content', async () => {
    process.env.GROQ_API_KEY = 'gsk-test-dummy'
    let seen
    vi.stubGlobal('fetch', (url, init) => {
      seen = { url, init }
      return Promise.resolve(okResponse('{"insights": []}'))
    })
    const text = await runAnalysis({ system: 'sys', user: 'usr' })
    expect(text).toBe('{"insights": []}')
    expect(seen.url).toBe('https://api.groq.com/openai/v1/chat/completions')
    const body = JSON.parse(seen.init.body)
    expect(body).toMatchObject({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'usr' },
      ],
      response_format: { type: 'json_object' },
    })
    expect(seen.init.headers.Authorization).toBe('Bearer gsk-test-dummy')
  })

  it('honors GROQ_MODEL when set', async () => {
    process.env.GROQ_API_KEY = 'gsk-test-dummy'
    process.env.GROQ_MODEL = 'qwen-qwen3-32b'
    let seen
    vi.stubGlobal('fetch', (url, init) => {
      seen = { url, init }
      return Promise.resolve(okResponse('{}'))
    })
    await runAnalysis({ system: 's', user: 'u' })
    expect(JSON.parse(seen.init.body).model).toBe('qwen-qwen3-32b')
  })

  it('maps HTTP failures to safe codes', async () => {
    process.env.GROQ_API_KEY = 'gsk-test-dummy'
    for (const [status, code] of [
      [429, 'AI_QUOTA_EXCEEDED'],
      [401, 'AI_UNAUTHORIZED'],
      [500, 'AI_REQUEST_FAILED'],
    ]) {
      vi.stubGlobal('fetch', () => Promise.resolve(new Response('nope', { status })))
      await failsWith(runAnalysis({ system: 's', user: 'u' }), code)
    }
  })

  it('rejects unparsable and empty bodies', async () => {
    process.env.GROQ_API_KEY = 'gsk-test-dummy'
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('not-json{', { status: 200 })))
    await failsWith(runAnalysis({ system: 's', user: 'u' }), 'AI_BAD_RESPONSE')

    vi.stubGlobal('fetch', () => Promise.resolve(okResponse('')))
    await failsWith(runAnalysis({ system: 's', user: 'u' }), 'AI_EMPTY_RESPONSE')

    vi.stubGlobal('fetch', () => Promise.resolve(okResponse(null)))
    await failsWith(runAnalysis({ system: 's', user: 'u' }), 'AI_EMPTY_RESPONSE')
  })

  it('maps aborts to timeout and other failures to network error', async () => {
    process.env.GROQ_API_KEY = 'gsk-test-dummy'
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    vi.stubGlobal('fetch', () => Promise.reject(abortError))
    await failsWith(runAnalysis({ system: 's', user: 'u' }), 'AI_TIMEOUT')

    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
    await failsWith(runAnalysis({ system: 's', user: 'u' }), 'AI_NETWORK_ERROR')
  })
})
