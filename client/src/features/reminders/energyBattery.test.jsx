import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EnergyBattery from './components/EnergyBattery.jsx'
import { latestCheckin, statusFor } from './components/energyBattery.helpers.js'

afterEach(() => {
  cleanup()
})

const checkins = [
  { id: 'c1', occurredAt: '2026-09-16T10:00:00.000Z', moodScore: 3, energyScore: 1, drainScore: 2 },
  { id: 'c2', occurredAt: '2026-09-18T10:00:00.000Z', moodScore: 4, energyScore: 2, drainScore: 4 },
]

describe('energy battery helpers', () => {
  it('picks the latest check-in regardless of order', () => {
    expect(latestCheckin([...checkins].reverse()).id).toBe('c2')
  })

  it('maps energy bands to calm status tags', () => {
    expect(statusFor(1).label).toBe('Low')
    expect(statusFor(3).label).toBe('Steady')
    expect(statusFor(5).label).toBe('Charged')
  })
})

describe('energy battery ring', () => {
  it('renders 40 percent with a Low badge directly below the ring', () => {
    render(<EnergyBattery checkins={checkins} />)
    expect(screen.getByRole('img', { name: /current energy 40 percent/i })).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.queryByText(/of 5/)).not.toBeInTheDocument()
  })

  it('shows an empty state with no check-ins', () => {
    render(<EnergyBattery checkins={[]} />)
    expect(screen.getByRole('img', { name: /no energy reading/i })).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
