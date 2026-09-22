import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import InsightsPage from './pages/InsightsPage.jsx'

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  vi.unstubAllGlobals()
})

describe('insights page', () => {
  it('renders the analyze trigger and handles the unreachable-server state', async () => {
    // Simulate an unreachable server explicitly: the suite must not depend
    // on whether something happens to listen on :5000 in the dev environment.
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Insights' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /analyze my recent check-ins/i }),
    ).toBeInTheDocument()
    // Unreachable server: the error contract surfaces via role=alert.
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('frames boundary insights as Observed / Reflection', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [
              {
                id: 'i1',
                type: 'boundary',
                title: 'Overtime keeps draining you',
                summary: 'Observed over three check-ins.',
                evidence: ['Time around overtime has felt draining 3 times lately.'],
                confidence: 'medium',
                suggestions: ['You may want to notice whether you are saying yes too often.'],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Observed' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reflection' })).toBeInTheDocument()
    // Boundary copy stays observational — no commands, labels, or diagnoses
    // in the evidence and reflection items themselves.
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '')
    expect(items.join(' ')).not.toMatch(/you must|toxic|diagnos/i)
  })
})
