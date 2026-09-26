import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TrendsPage from './pages/TrendsPage.jsx'

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  vi.unstubAllGlobals()
})

function jsonResponse(body) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('trends page', () => {
  it('renders the window tabs and an empty state with no check-ins', async () => {
    vi.stubGlobal('fetch', () =>
      jsonResponse({ windowDays: 30, days: [], totalCheckins: 0, topDrainingTags: [] }),
    )
    render(
      <MemoryRouter>
        <TrendsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Trends' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '30 days' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('No check-ins in this window')).toBeInTheDocument()
  })

  it('renders the chart and draining tags once trend data loads', async () => {
    vi.stubGlobal('fetch', () =>
      jsonResponse({
        windowDays: 30,
        days: [
          { date: '2026-09-01T00:00:00.000Z', avgMood: 3, avgEnergy: 3, avgDrain: 5, checkins: 2 },
          { date: '2026-09-02T00:00:00.000Z', avgMood: 5, avgEnergy: 5, avgDrain: 1, checkins: 1 },
        ],
        totalCheckins: 3,
        topDrainingTags: [{ tag: 'work', count: 2 }],
      }),
    )
    render(
      <MemoryRouter>
        <TrendsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('img', { name: /mood and energy trend/i })).toBeInTheDocument()
    expect(screen.getByText("What's come up most on draining days")).toBeInTheDocument()
    expect(screen.getByText('work')).toBeInTheDocument()
    expect(screen.getByText('2×')).toBeInTheDocument()
  })

  it('renders the At a glance summary from the same trend payload', async () => {
    vi.stubGlobal('fetch', () =>
      jsonResponse({
        windowDays: 30,
        days: [
          { date: '2026-09-01T00:00:00.000Z', avgMood: 3, avgEnergy: 3, avgDrain: 5, checkins: 2 },
          { date: '2026-09-02T00:00:00.000Z', avgMood: 5, avgEnergy: 5, avgDrain: 1, checkins: 1 },
        ],
        totalCheckins: 3,
        topDrainingTags: [{ tag: 'work', count: 2 }],
      }),
    )
    render(
      <MemoryRouter>
        <TrendsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'At a glance' })).toBeInTheDocument()
    expect(screen.getByText('3 check-ins logged')).toBeInTheDocument()
    // Weighted means: (3*2 + 5) / 3 = 3.7 for all three metrics.
    expect(screen.getByText('Above your middle ground')).toBeInTheDocument()
    expect(screen.getByText('Following the same rhythm as mood')).toBeInTheDocument()
    expect(screen.getByText('Work shows up most often here')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Mood trend: rising' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Energy trend: rising' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Drain trend: falling' })).toBeInTheDocument()
  })

  it('re-fetches with the newly selected window when a tab is clicked', async () => {
    const fetchSpy = vi.fn(() =>
      jsonResponse({ windowDays: 7, days: [], totalCheckins: 0, topDrainingTags: [] }),
    )
    vi.stubGlobal('fetch', fetchSpy)
    render(
      <MemoryRouter>
        <TrendsPage />
      </MemoryRouter>,
    )

    await screen.findByText('No check-ins in this window')
    fireEvent.click(screen.getByRole('tab', { name: '7 days' }))

    expect(await screen.findByRole('tab', { name: '7 days' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1]
    expect(lastCall[0]).toMatch(/windowDays=7/)
  })
})
