import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import RhythmChart from './components/RhythmChart.jsx'

afterEach(() => {
  cleanup()
})

const three = [
  { id: 'c1', occurredAt: '2026-09-16T10:00:00.000Z', moodScore: 2, energyScore: 2, drainScore: 2 },
  { id: 'c2', occurredAt: '2026-09-17T10:00:00.000Z', moodScore: 3, energyScore: 1, drainScore: 4 },
  { id: 'c3', occurredAt: '2026-09-18T10:00:00.000Z', moodScore: 4, energyScore: 3, drainScore: 5 },
]

describe('rhythm chart', () => {
  it('renders trend lines plus hidden data table for screen readers', () => {
    const { container } = render(<RhythmChart checkins={three} />)
    expect(screen.getByRole('img', { name: /last 3 check-ins/i })).toBeInTheDocument()
    // 3 mood + 3 energy + 3 drain dots
    expect(container.querySelectorAll('circle').length).toBe(9)
    expect(screen.getByText('Recent check-in scores')).toBeInTheDocument()
  })

  it('marks high drain points distinctly', () => {
    const { container } = render(<RhythmChart checkins={three} />)
    const high = container.querySelectorAll('circle[data-high-drain="true"]')
    expect(high.length).toBe(2)
  })

  it('shows a calm empty state with fewer than two check-ins', () => {
    render(<RhythmChart checkins={[three[0]]} />)
    expect(screen.getByText(/rhythm will take shape/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
