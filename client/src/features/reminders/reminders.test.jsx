import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SignalsPanel from './components/SignalsPanel.jsx'

describe('signals panel', () => {
  it('renders each signal as a supportive observation', () => {
    render(
      <SignalsPanel
        signals={[
          { type: 'low_energy_streak', evidence: { lowEnergyCount: 3, checkins: 4 } },
          {
            type: 'repeated_draining_context',
            evidence: { context: 'overtime', highDrainCount: 2 },
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Noticing lately' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    // Observational language only — no commands, no diagnoses.
    expect(screen.queryByText(/you must|diagnos|toxic/i)).not.toBeInTheDocument()
  })

  it('shows a neutral empty state when there is nothing to surface', () => {
    render(<SignalsPanel signals={[]} />)
    expect(screen.getByText(/no patterns standing out/i)).toBeInTheDocument()
  })
})
