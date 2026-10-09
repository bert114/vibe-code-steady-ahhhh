import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RequireAuth } from '../../app/auth.jsx'
import { clearTokenGetter, setTokenGetter } from './authToken.js'
import { request } from './request.js'

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  vi.unstubAllGlobals()
  clearTokenGetter()
})

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('request auth plumbing', () => {
  it('sends no Authorization header without a registered token', async () => {
    let headers
    vi.stubGlobal('fetch', (url, init) => {
      headers = init.headers
      return Promise.resolve(jsonResponse({ ok: true }))
    })
    await request('/probe')
    expect(headers.Authorization).toBeUndefined()
  })

  it('attaches a fresh Bearer token on every call', async () => {
    const seen = []
    setTokenGetter(() => `tok-${seen.length}`)
    vi.stubGlobal('fetch', (url, init) => {
      seen.push(init.headers.Authorization)
      return Promise.resolve(jsonResponse({ ok: true }))
    })
    await request('/a')
    await request('/b')
    expect(seen).toEqual(['Bearer tok-0', 'Bearer tok-1'])
  })

  it('surfaces 401s through the error contract for the UI gates', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Nope.', details: [] } }, 401),
      ),
    )
    await expect(request('/probe')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})

describe('RequireAuth without Clerk keys (dev bypass mode)', () => {
  it('renders protected content directly', () => {
    render(
      <RequireAuth>
        <p>protected content</p>
      </RequireAuth>,
    )
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
