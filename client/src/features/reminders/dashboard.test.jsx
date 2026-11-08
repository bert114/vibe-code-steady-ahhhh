import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ToastStack from '../../components/ui/Toast.jsx'
import { useToastStore } from '../../components/ui/toastStore.js'
import FeedbackLink from './components/FeedbackLink.jsx'
import WellbeingOverviewPage from './pages/WellbeingOverviewPage.jsx'

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  useToastStore.getState().clear()
  vi.unstubAllGlobals()
  window.sessionStorage?.clear?.()
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
      <WellbeingOverviewPage />
    </MemoryRouter>,
  )
}

describe('wellbeing overview page', () => {
  it('renders the summary sections from one payload', async () => {
    renderPage(() => Promise.resolve(jsonResponse(summaryPayload)))

    expect(await screen.findByRole('heading', { name: 'Energy Overview' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Latest pattern' })).toBeInTheDocument()
    expect(screen.getByText('Overtime keeps draining you')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Noticing lately' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reminders' })).toBeInTheDocument()
    expect(screen.getByText(/1 unread reminder/)).toBeInTheDocument()
    expect(screen.getByText(/notice what overtime does/i)).toBeInTheDocument()
    // Compact battery ring card: header + timestamp, no redundant copy.
    expect(screen.getByText('Current Energy')).toBeInTheDocument()
    expect(screen.getByText(/Updated Sep 18/)).toBeInTheDocument()
    expect(screen.queryByText(/Energy 1 of 5/)).not.toBeInTheDocument()
    expect(screen.queryByText(/not a diagnosis/)).not.toBeInTheDocument()
    // Energy Overview capsule card replaces the old rhythm list (KPI row removed).
    expect(screen.queryByText('Current Level')).not.toBeInTheDocument()
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
    expect(screen.queryByText(/mood 2 · energy 1/)).not.toBeInTheDocument()
    // Battery + overview share one 2-col row (no full-width dead space).
    const duo = document.querySelector('.dashboard-page__duo')
    expect(duo).not.toBeNull()
    expect(duo.textContent).toMatch(/Current Energy/)
    expect(duo.textContent).toMatch(/Energy Overview/)

    const dashboard = document.querySelector('.dashboard-page')
    const sections = [...dashboard.children]
    expect(sections.indexOf(duo)).toBeLessThan(
      sections.indexOf(document.querySelector('.dashboard-page__featured-insight')),
    )
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

  it('shows an error toast (not an inline alert) when the summary cannot load', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
    render(
      <MemoryRouter>
        <WellbeingOverviewPage />
        <ToastStack />
      </MemoryRouter>,
    )
    // Mount triggers load(); the shared request helper surfaces the failure
    // as an error toast — the page itself renders no inline alert.
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not reach the server/i)
    expect(alert.closest('.toast-stack')).not.toBeNull()
  })

  it('shows a simple optional check-in guide when the user has not checked in today and hides it on skip', async () => {
    renderPage(() => Promise.resolve(jsonResponse(summaryPayload)))

    expect(
      await screen.findByRole('heading', { name: 'How are you feeling today?' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Optional check-in guide/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Low' })).toHaveAttribute('href', '/check-in?mood=1')
    expect(screen.getByRole('link', { name: 'Okay' })).toHaveAttribute('href', '/check-in?mood=3')
    expect(screen.getByRole('link', { name: 'Good' })).toHaveAttribute('href', '/check-in?mood=5')

    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }))
    expect(
      screen.queryByRole('heading', { name: 'How are you feeling today?' }),
    ).not.toBeInTheDocument()
  })

  it('hides the check-in guide when the user has already checked in today', async () => {
    const todayPayload = {
      ...summaryPayload,
      recentCheckins: [
        {
          id: 'c-today',
          occurredAt: new Date().toISOString(),
          moodScore: 4,
          energyScore: 4,
          drainScore: 2,
        },
      ],
    }
    renderPage(() => Promise.resolve(jsonResponse(todayPayload)))

    expect(await screen.findByRole('heading', { name: 'Energy Overview' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'How are you feeling today?' }),
    ).not.toBeInTheDocument()
  })

  it('pops up a hospitable host modal when the user has not checked in today and closes on dismiss', async () => {
    renderPage(() => Promise.resolve(jsonResponse(summaryPayload)))

    const modal = await screen.findByRole('dialog', { name: /Welcome in/i })
    expect(modal).toBeInTheDocument()
    expect(screen.getByText(/A safe space for you/i)).toBeInTheDocument()
    expect(screen.getByText(/Private to you · Zero pressure/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close welcome guide' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start reflection with Low mood/i })).toHaveAttribute(
      'href',
      '/check-in?mood=1',
    )
    expect(
      screen.getByRole('link', { name: /Guide me through a reflection/i }),
    ).toHaveAttribute('href', '/check-in')

    fireEvent.click(screen.getByRole('button', { name: 'Skip daily check-in for now' }))
    expect(screen.queryByRole('dialog', { name: /Welcome in/i })).not.toBeInTheDocument()
  })

  it('does not pop up the modal when the user has already checked in today', async () => {
    const todayPayload = {
      ...summaryPayload,
      recentCheckins: [
        {
          id: 'c-today',
          occurredAt: new Date().toISOString(),
          moodScore: 4,
          energyScore: 4,
          drainScore: 2,
        },
      ],
    }
    renderPage(() => Promise.resolve(jsonResponse(todayPayload)))

    expect(await screen.findByRole('heading', { name: 'Energy Overview' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Welcome in/i })).not.toBeInTheDocument()
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
