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

    expect(await screen.findByText(/You have 128 check-ins logged since \w+ \d{4}\./)).toBeInTheDocument()
    expect(screen.getByText('3.4')).toBeInTheDocument()
    // The drain number is explained in place, not left as a bare metric.
    expect(screen.getByText(/out of 5 \(1 is light, 5 is heavy\)/)).toBeInTheDocument()
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

    expect(await screen.findByText(/You have 128 check-ins logged/)).toBeInTheDocument()
    expect(screen.queryByText(/average drain/i)).not.toBeInTheDocument()
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
      await screen.findByRole('heading', { name: 'This week' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Elevated')).toBeInTheDocument()
    expect(screen.getByText('Several strain signals overlapped this week.')).toBeInTheDocument()
    expect(screen.getByText('Low energy in 3 of your last 5 check-ins.')).toBeInTheDocument()
    expect(screen.getByText('High drain in 3 of your last 5 check-ins.')).toBeInTheDocument()
    expect(screen.getByText('Repeated feelings: tired.')).toBeInTheDocument()
    expect(
      screen.getByText(/Based on 5 check-ins in the last 7 days\./),
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
    // The non-diagnosis framing is stated once, in the page footer.
    expect(screen.getAllByText(/not a diagnosis/)).toHaveLength(1)
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
    expect(screen.queryByRole('list', { name: /Signals from/ })).not.toBeInTheDocument()
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

  it('explains every insight in one list with plain confidence labels', async () => {
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

    expect(await screen.findByText('Boundary pressure at work')).toBeInTheDocument()
    expect(screen.getByText('Consecutive draining days')).toBeInTheDocument()
    expect(screen.getByText(/Boundary · Possible pattern/)).toBeInTheDocument()
    expect(screen.getByText(/Burnout signal · Clear pattern/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What this is based on' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Something to consider' })).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('displays mood/energy/drain averages, interactions, most draining interaction, and switches between Week and Month', async () => {
    const now = Date.now()
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
    const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString()

    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            insights: [
              {
                id: 'recent-1',
                type: 'burnout',
                title: 'Recent week strain',
                summary: 'Recent check-ins felt heavy.',
                evidence: ['Low energy 3 times.'],
                confidence: 'high',
                suggestions: ['Protect a rest block.'],
                createdAt: twoDaysAgo,
              },
              {
                id: 'month-1',
                type: 'boundary',
                title: 'Earlier month boundary',
                summary: 'From earlier this month.',
                evidence: ['Overtime 3 times.'],
                confidence: 'medium',
                suggestions: ['Notice when you say yes.'],
                createdAt: twentyDaysAgo,
              },
            ],
            periods: {
              week: {
                windowDays: 7,
                checkins: 4,
                averageMood: 3.8,
                averageEnergy: 2.2,
                averageDrain: 3.5,
                interactions: [
                  { tag: 'work', count: 3, averageDrain: 4.3 },
                  { tag: 'calls', count: 2, averageDrain: 3.0 },
                ],
                mostDrainingInteraction: { tag: 'work', count: 3, averageDrain: 4.3 },
              },
              month: {
                windowDays: 30,
                checkins: 10,
                averageMood: 3.2,
                averageEnergy: 3.1,
                averageDrain: 2.8,
                interactions: [
                  { tag: 'work', count: 5, averageDrain: 3.8 },
                  { tag: 'family dinner', count: 4, averageDrain: 4.5 },
                ],
                mostDrainingInteraction: { tag: 'family dinner', count: 4, averageDrain: 4.5 },
              },
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

    // Defaults to Week (7 days)
    expect(await screen.findByRole('heading', { name: 'This week' })).toBeInTheDocument()
    expect(screen.getByText('3.8')).toBeInTheDocument()
    expect(screen.getByText('2.2')).toBeInTheDocument()
    expect(screen.getByText('3.5')).toBeInTheDocument()
    expect(screen.getByText('Most draining interaction')).toBeInTheDocument()
    expect(screen.getByText(/4\.3 \/ 5 drain/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Interactions logged' })).toHaveTextContent('work')
    expect(screen.getByRole('list', { name: 'Interactions logged' })).toHaveTextContent('calls')
    expect(screen.getByText('Recent week strain')).toBeInTheDocument()
    expect(screen.queryByText('Earlier month boundary')).not.toBeInTheDocument()

    // Switch dropdown to Month (30 days)
    const select = screen.getByLabelText('Time range')
    fireEvent.change(select, { target: { value: 'month' } })

    expect(screen.getByRole('heading', { name: 'This month' })).toBeInTheDocument()
    expect(screen.getByText('3.2')).toBeInTheDocument()
    expect(screen.getByText('3.1')).toBeInTheDocument()
    expect(screen.getByText('2.8')).toBeInTheDocument()
    expect(screen.getByText(/4\.5 \/ 5 drain/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Interactions logged' })).toHaveTextContent(
      'family dinner',
    )
    expect(screen.getByText('Earlier month boundary')).toBeInTheDocument()
  })
})

