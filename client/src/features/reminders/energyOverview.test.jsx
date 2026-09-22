import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EnergyOverview from './components/EnergyOverview.jsx'
import { bucketWeek } from './components/energyBattery.helpers.js'

afterEach(() => {
  cleanup()
})

const checkins = [
  { id: 'c1', occurredAt: '2026-09-16T10:00:00.000Z', moodScore: 3, energyScore: 1, drainScore: 2 },
  { id: 'c2', occurredAt: '2026-09-18T10:00:00.000Z', moodScore: 4, energyScore: 2, drainScore: 4 },
  { id: 'c3', occurredAt: '2026-09-18T18:00:00.000Z', moodScore: 4, energyScore: 4, drainScore: 2 },
]

describe('bucketWeek', () => {
  it('builds a rolling 7-day window ending on the latest check-in', () => {
    const { days, activeIndex, current } = bucketWeek(checkins)
    expect(days).toHaveLength(7)
    expect(activeIndex).toBe(6)
    expect(current.percent).toBe(80)
    expect(current.checkinId).toBe('c3')
  })

  it('leaves empty days as gaps', () => {
    const { days } = bucketWeek(checkins)
    expect(days.filter((d) => d.percent === null).length).toBeGreaterThan(0)
  })

  it('handles no check-ins with no active day', () => {
    const { days, activeIndex, current } = bucketWeek([])
    expect(days).toHaveLength(7)
    expect(activeIndex).toBe(-1)
    expect(current).toBeNull()
  })
})

describe('energy overview chart', () => {
  it('renders header and 7 capsules with tooltips, no KPI row', () => {
    render(<EnergyOverview checkins={checkins} />)
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
    expect(screen.queryByText('Current Level')).not.toBeInTheDocument()
    expect(screen.queryByText('80%')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(7)
    expect(screen.getByText('Sep 18, 2026')).toBeInTheDocument()
  })

  it('uses an SVG-free badge-free card and bans old copy', () => {
    const { container } = render(<EnergyOverview checkins={checkins} />)
    expect(container.textContent).not.toMatch(/⚡/)
    expect(container.textContent).not.toMatch(/of 5/)
    expect(container.textContent).not.toMatch(/This is your current battery/)
    expect(container.textContent).not.toMatch(/Current Level/)
  })

  it('shows faint tracks with no check-ins', () => {
    render(<EnergyOverview checkins={[]} />)
    expect(screen.getAllByRole('button')).toHaveLength(7)
    expect(screen.getByRole('img', { name: /no energy readings/i })).toBeInTheDocument()
  })
})
