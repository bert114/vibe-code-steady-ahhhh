import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  it('renders the time-range dropdown and an empty state with no check-ins', async () => {
    vi.stubGlobal('fetch', () =>
      jsonResponse({ windowDays: 30, days: [], totalCheckins: 0, topDrainingTags: [] }),
    )
    render(
      <MemoryRouter>
        <TrendsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Time range' })).toHaveValue('30')
    expect(screen.getByRole('option', { name: 'Week' })).toHaveValue('7')
    expect(screen.getByRole('option', { name: 'Month' })).toHaveValue('30')
    expect(screen.queryByRole('option', { name: '90 days' })).not.toBeInTheDocument()
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

  it('re-fetches with the newly selected window when the range changes', async () => {
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
    const range = screen.getByRole('combobox', { name: 'Time range' })
    fireEvent.change(range, { target: { value: '7' } })

    expect(range).toHaveValue('7')
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
    const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1]
    expect(lastCall[0]).toMatch(/windowDays=7/)
  })
})
