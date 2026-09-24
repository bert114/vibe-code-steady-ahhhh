import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CheckInHistoryList from './components/CheckInHistoryList.jsx'

const sampleCheckins = [
  {
    id: 'c1',
    occurredAt: '2026-09-24T10:00:00.000Z',
    moodScore: 5,
    energyScore: 3,
    drainScore: 1,
    emotions: ['calm', 'focused'],
    contextTags: ['deep-work'],
    note: 'Felt very productive and undisturbed this morning.',
  },
  {
    id: 'c2',
    occurredAt: '2026-09-23T14:30:00.000Z',
    moodScore: 1,
    energyScore: 1,
    drainScore: 5,
    emotions: ['exhausted'],
    contextTags: ['meetings'],
    note: 'Back-to-back calls without a break. Need to step away.',
  },
]

describe('check-in history list', () => {
  it('renders an empty state card when there are no check-ins', () => {
    render(<CheckInHistoryList checkins={[]} onDelete={() => {}} />)
    expect(screen.getByText('No check-ins yet')).toBeInTheDocument()
    expect(
      screen.getByText(/Take a moment to record your first check-in above/i),
    ).toBeInTheDocument()
  })

  it('renders check-in cards with scores, tags, and notes', () => {
    render(<CheckInHistoryList checkins={sampleCheckins} onDelete={() => {}} />)

    // Scores rendered as badges
    expect(screen.getByText('Mood: Great')).toBeInTheDocument()
    expect(screen.getByText('Energy: Steady')).toBeInTheDocument()
    expect(screen.getByText('Drain: Light')).toBeInTheDocument()

    expect(screen.getByText('Mood: Rough')).toBeInTheDocument()
    expect(screen.getByText('Energy: Empty')).toBeInTheDocument()
    expect(screen.getByText('Drain: Heavy')).toBeInTheDocument()

    // Tags
    expect(screen.getByText('calm')).toBeInTheDocument()
    expect(screen.getByText('#deep-work')).toBeInTheDocument()

    // Note preview
    expect(
      screen.getByText('Felt very productive and undisturbed this morning.'),
    ).toBeInTheDocument()
  })

  it('handles two-step delete confirmation', async () => {
    const onDelete = vi.fn().mockResolvedValue()
    render(<CheckInHistoryList checkins={[sampleCheckins[0]]} onDelete={onDelete} />)

    const deleteBtn = screen.getByRole('button', { name: /delete check-in/i })
    fireEvent.click(deleteBtn)

    // Confirmation UI appears
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })

    // Cancel closes confirmation
    fireEvent.click(cancelBtn)
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument()

    // Click delete again and confirm
    fireEvent.click(screen.getByRole('button', { name: /delete check-in/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(onDelete).toHaveBeenCalledWith('c1')
  })
})
