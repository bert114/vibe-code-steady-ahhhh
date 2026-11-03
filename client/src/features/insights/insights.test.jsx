import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ToastStack from '../../components/ui/Toast.jsx'
import { useToastStore } from '../../components/ui/toastStore.js'
import InsightsPage from './pages/InsightsPage.jsx'

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  useToastStore.getState().clear()
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
        <ToastStack />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Insights' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /analyze my recent check-ins/i }),
    ).toBeInTheDocument()
    // Unreachable server: the shared request helper surfaces the failure as
    // an error toast — the page itself renders no inline alert.
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not reach the server/i)
    expect(alert.closest('.toast-stack')).not.toBeNull()
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

  it('shows the all-time check-in total with the insights', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [],
            totalCheckins: 128,
            firstCheckinAt: '2026-03-04T10:00:00.000Z',
            weeklyDrain: { windowDays: 7, averageDrain: 3.4, checkins: 6 },
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

    expect(await screen.findByText('128')).toBeInTheDocument()
    expect(screen.getByText(/check-ins logged since \w+ \d{4}/)).toBeInTheDocument()
    expect(screen.getByText('3.4')).toBeInTheDocument()
    expect(screen.getByText(/\/ 5 average interaction drain, last 7 days/)).toBeInTheDocument()
  })

  it('hides the weekly drain when the last 7 days have no check-ins', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [],
            totalCheckins: 128,
            firstCheckinAt: '2026-03-04T10:00:00.000Z',
            weeklyDrain: { windowDays: 7, averageDrain: null, checkins: 0 },
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

    expect(await screen.findByText('128')).toBeInTheDocument()
    expect(screen.queryByText(/average interaction drain/i)).not.toBeInTheDocument()
  })

  it('shows the weekly burnout level with its evidence', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [],
            weeklyBurnout: {
              windowDays: 7,
              checkins: 5,
              minimumCheckins: 3,
              level: 'elevated',
              signals: [
                {
                  type: 'low_energy_streak',
                  evidence: { checkins: 5, lowEnergyCount: 3 },
                },
                {
                  type: 'high_drain_repeat',
                  evidence: { checkins: 5, highDrainCount: 3 },
                },
                {
                  type: 'repeated_emotions',
                  evidence: { checkins: 5, repeated: [{ tag: 'tired', count: 3 }] },
                },
              ],
            },
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

    expect(
      await screen.findByRole('heading', { name: 'Burnout signals this week' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Elevated')).toBeInTheDocument()
    expect(screen.getByText('Several strain signals overlapped this week.')).toBeInTheDocument()
    expect(screen.getByText('Low energy in 3 of your last 5 check-ins.')).toBeInTheDocument()
    expect(screen.getByText('High drain in 3 of your last 5 check-ins.')).toBeInTheDocument()
    expect(screen.getByText('Repeated feelings: tired.')).toBeInTheDocument()
    expect(
      screen.getByText(/Based on 5 check-ins in the last 7 days\. Observation, not a diagnosis\./),
    ).toBeInTheDocument()
  })

  it('shows a gathering state when the week has too few check-ins', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [],
            weeklyBurnout: {
              windowDays: 7,
              checkins: 2,
              minimumCheckins: 3,
              level: 'insufficient',
              signals: [],
            },
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

    expect(await screen.findByText('Not enough yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'A weekly pattern needs at least 3 check-ins. You have 2 check-ins in the last 7 days.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Low energy in/)).not.toBeInTheDocument()
    expect(screen.getByText(/Observation, not a diagnosis\./)).toBeInTheDocument()
  })

  it('shows a steady week without an evidence list', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [],
            weeklyBurnout: {
              windowDays: 7,
              checkins: 4,
              minimumCheckins: 3,
              level: 'steady',
              signals: [],
            },
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

    expect(await screen.findByText('Steady')).toBeInTheDocument()
    expect(screen.getByText(/No burnout signals stood out/)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /Burnout signals/ })).not.toBeInTheDocument()
  })

  it('hides the total until there is check-in history', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [],
            totalCheckins: 0,
            firstCheckinAt: null,
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

    expect(
      await screen.findByRole('heading', { name: 'Your check-ins will shape this space' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/check-ins logged/i)).not.toBeInTheDocument()
  })

  it('filters insights by category tabs', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [
              {
                id: 'b1',
                type: 'boundary',
                title: 'Boundary pressure at work',
                summary: 'Frequent overtime.',
                evidence: ['Late meetings 3 times.'],
                confidence: 'medium',
                suggestions: ['Consider protecting finish times.'],
              },
              {
                id: 'o1',
                type: 'burnout',
                title: 'Consecutive draining days',
                summary: 'Energy is depleted.',
                evidence: ['Energy scored low 4 days in a row.'],
                confidence: 'high',
                suggestions: ['Take an uninterrupted rest window.'],
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

    // Both appear on All Patterns
    expect(await screen.findByText('Boundary pressure at work')).toBeInTheDocument()
    expect(screen.getByText('Consecutive draining days')).toBeInTheDocument()

    // Switch to Boundaries tab
    const boundariesTab = screen.getByRole('tab', { name: 'Boundaries' })
    fireEvent.click(boundariesTab)
    expect(screen.getByText('Boundary pressure at work')).toBeInTheDocument()
    expect(screen.queryByText('Consecutive draining days')).not.toBeInTheDocument()

    // Switch to Burnout Signals tab
    const burnoutTab = screen.getByRole('tab', { name: 'Burnout Signals' })
    fireEvent.click(burnoutTab)
    expect(screen.queryByText('Boundary pressure at work')).not.toBeInTheDocument()
    expect(screen.getByText('Consecutive draining days')).toBeInTheDocument()
  })
})

