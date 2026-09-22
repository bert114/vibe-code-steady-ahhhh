import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FeedbackLink from './components/FeedbackLink.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  vi.unstubAllGlobals()
})

const summaryPayload = {
  recentCheckins: [
    {
      id: 'c1',
      occurredAt: '2026-09-18T10:00:00.000Z',
      moodScore: 2,
      energyScore: 1,
      drainScore: 5,
    },
  ],
  latestInsight: {
    id: 'i1',
    type: 'boundary',
    title: 'Overtime keeps draining you',
    summary: 'Observed over three check-ins.',
    evidence: ['drained after overtime'],
    confidence: 'medium',
    suggestions: [],
  },
  signals: [
    { type: 'repeated_draining_context', evidence: { context: 'overtime', highDrainCount: 2 } },
  ],
  signalsMeta: { windowDays: 7, checkinsConsidered: 3 },
  reminders: [
    {
      id: 'r1',
      insightId: 'i1',
      kind: 'insight',
      message: 'Notice what overtime does to your energy.',
      readAt: null,
      createdAt: '2026-09-18T11:00:00.000Z',
    },
  ],
  unreadReminders: 1,
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage(fetchImpl) {
  vi.stubGlobal('fetch', fetchImpl)
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('dashboard page', () => {
  it('renders the summary sections from one payload', async () => {
    renderPage(() => Promise.resolve(jsonResponse(summaryPayload)))

    expect(await screen.findByRole('heading', { name: 'Recent check-ins' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Latest insight' })).toBeInTheDocument()
    expect(screen.getByText('Overtime keeps draining you')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Noticing lately' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reminders' })).toBeInTheDocument()
    expect(screen.getByText(/1 unread reminder/)).toBeInTheDocument()
    expect(screen.getByText(/notice what overtime does/i)).toBeInTheDocument()
    // Compact battery ring card: header + timestamp, no redundant copy.
    expect(screen.getByText('Current Energy')).toBeInTheDocument()
    expect(screen.getByText(/Updated Sep 18/)).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
    expect(screen.queryByText(/Energy 1 of 5/)).not.toBeInTheDocument()
    expect(screen.queryByText(/not a diagnosis/)).not.toBeInTheDocument()
  })

  it('marks a reminder as read and updates the unread count', async () => {
    const calls = []
    renderPage((url, init) => {
      calls.push({ url, method: init?.method })
      if (init?.method === 'PATCH') {
        return Promise.resolve(
          jsonResponse({ ...summaryPayload.reminders[0], readAt: '2026-09-19T10:00:00.000Z' }),
        )
      }
      return Promise.resolve(jsonResponse(summaryPayload))
    })

    const button = await screen.findByRole('button', { name: 'Mark as read' })
    fireEvent.click(button)

    await waitFor(() => {
      expect(calls.some((c) => c.method === 'PATCH' && c.url.endsWith('/reminders/r1/read'))).toBe(
        true,
      )
    })
    expect(await screen.findByText('Read')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as read' })).not.toBeInTheDocument()
  })

  it('shows an alert when the summary cannot load', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    // Mount triggers load(); rejection surfaces through the error contract.
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})

describe('feedback link', () => {
  it('renders the external form link when a URL is configured', () => {
    render(<FeedbackLink url="https://example.com/feedback" />)
    const link = screen.getByRole('link', { name: /share feedback/i })
    expect(link).toHaveAttribute('href', 'https://example.com/feedback')
  })

  it('renders nothing without a configured URL', () => {
    const { container } = render(<FeedbackLink url="" />)
    expect(container).toBeEmptyDOMElement()
  })
})
