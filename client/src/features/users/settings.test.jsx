import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SettingsPage from './pages/SettingsPage.jsx'

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  vi.unstubAllGlobals()
})

describe('settings page', () => {
  it('explains ownership, AI data use, and the non-medical boundary', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Your data' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How AI uses your data' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Not medical advice' })).toBeInTheDocument()
  })

  it('requires confirmation, then deletes the account', async () => {
    const calls = []
    vi.stubGlobal('fetch', (url, init) => {
      calls.push({ url, method: init?.method })
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    // First click only arms the confirmation state — no request yet.
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    expect(calls).toHaveLength(0)
    expect(
      screen.getByRole('button', { name: 'Click again to confirm deletion' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Click again to confirm deletion' }))
    expect(await screen.findByRole('heading', { name: 'Account deleted' })).toBeInTheDocument()
    expect(calls).toEqual([{ url: expect.stringMatching(/\/users\/me$/), method: 'DELETE' }])
  })

  it('shows an alert when deletion fails', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    fireEvent.click(screen.getByRole('button', { name: 'Click again to confirm deletion' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
