import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ToastStack from '../../components/ui/Toast.jsx'
import { useToastStore } from '../../components/ui/toastStore.js'
import SettingsPage from './pages/SettingsPage.jsx'

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  useToastStore.getState().clear()
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

  it('shows an error toast (not an inline alert) when deletion fails', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
    render(
      <MemoryRouter>
        <SettingsPage />
        <ToastStack />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    fireEvent.click(screen.getByRole('button', { name: 'Click again to confirm deletion' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not reach the server/i)
    expect(alert.closest('.toast-stack')).not.toBeNull()
  })

  it('triggers data export and calls /users/export', async () => {
    let exportCalled = false
    vi.stubGlobal('fetch', (url) => {
      if (String(url).includes('/users/export')) {
        exportCalled = true
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                checkins: [],
                insights: [],
                reminders: [],
                exportedAt: '2026-09-24T12:00:00.000Z',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }
      return Promise.resolve(new Response(null, { status: 200 }))
    })

    // Mock URL.createObjectURL, URL.revokeObjectURL, and HTMLAnchorElement.prototype.click
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(
      <MemoryRouter>
        <SettingsPage />
        <ToastStack />
      </MemoryRouter>,
    )

    const exportBtn = screen.getByRole('button', { name: /export my data/i })
    expect(exportBtn).toBeInTheDocument()

    fireEvent.click(exportBtn)
    await waitFor(() => expect(exportCalled).toBe(true))

    const alert = await screen.findByRole('status')
    expect(alert).toHaveTextContent(/Your data export has downloaded/i)
    clickSpy.mockRestore()
  })
})

