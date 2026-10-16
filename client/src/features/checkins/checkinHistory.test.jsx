import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
      screen.getByText(/Save your first check-in above to start your history/i),
    ).toBeInTheDocument()
  })

  it('renders check-in cards with scores, tags, and notes', () => {
    render(<CheckInHistoryList checkins={sampleCheckins} onDelete={() => {}} />)

    // Scores rendered as value-only subs with full labels on the boxes
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Some')).toBeInTheDocument()
    expect(screen.getByText('Not at all')).toBeInTheDocument()

    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Very little')).toBeInTheDocument()
    expect(screen.getByText('A lot')).toBeInTheDocument()

    expect(screen.getByLabelText('Mood: Good')).toBeInTheDocument()
    expect(screen.getByLabelText('Energy: Very little')).toBeInTheDocument()
    expect(screen.getByLabelText('Feeling drained: A lot')).toBeInTheDocument()

    // Tags
    expect(screen.getByText('calm')).toBeInTheDocument()
    expect(screen.getByText('#deep-work')).toBeInTheDocument()

    // Note preview
    expect(
      screen.getByText('Felt very productive and undisturbed this morning.'),
    ).toBeInTheDocument()
  })

  it('lays out groups in wireframe order: header, 3 score boxes, note lines, bottom optionals', () => {
    const { container } = render(
      <CheckInHistoryList checkins={[sampleCheckins[0]]} onDelete={() => {}} />,
    )
    const card = container.querySelector('.history-card')
    expect(card).not.toBeNull()

    const groups = Array.from(card.children).map((el) => el.className)
    expect(groups).toEqual([
      'history-card__header',
      'history-card__scores',
      'history-card__note-lines',
      'history-card__optionals',
    ])

    // 3 uniform score boxes
    expect(card.querySelectorAll('.history-card__score-box')).toHaveLength(3)
    // Each score box pairs one semantic icon with its value-only sub
    card.querySelectorAll('.history-card__score-box').forEach((box) => {
      const icon = box.querySelector('.history-card__score-icon svg[aria-hidden="true"]')
      expect(icon).not.toBeNull()
      expect(box.querySelector('.history-card__score-sub')).not.toBeNull()
    })
    // Bottom optionals: emotions box, context box (short note has no expand box)
    expect(card.querySelectorAll('.history-card__optional-box')).toHaveLength(2)
  })

  it('expands long notes from the bottom optionals row', () => {
    const longNote = `${'word '.repeat(40)}end`
    render(
      <CheckInHistoryList
        checkins={[{ ...sampleCheckins[0], note: longNote }]}
        onDelete={() => {}}
      />,
    )
    expect(screen.getByText('Read full note')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Read full note' }))
    expect(screen.getByText('Show less')).toBeInTheDocument()
    expect(screen.getByText(longNote)).toBeInTheDocument()
  })

  it('collapses missing optionals with no empty boxes', () => {
    const { container } = render(
      <CheckInHistoryList
        checkins={[
          {
            id: 'c3',
            occurredAt: '2026-09-22T09:00:00.000Z',
            moodScore: 3,
            energyScore: 3,
            drainScore: 3,
            emotions: [],
            contextTags: [],
            note: '',
          },
        ]}
        onDelete={() => {}}
      />,
    )
    const card = container.querySelector('.history-card')
    expect(card.querySelector('.history-card__note-lines')).toBeNull()
    expect(card.querySelector('.history-card__optionals')).toBeNull()
    expect(card.querySelectorAll('.history-card__score-box')).toHaveLength(3)
  })

  it('shows the selected check-in details and cancels without deleting', () => {
    const onDelete = vi.fn()
    render(<CheckInHistoryList checkins={[sampleCheckins[0]]} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: /delete check-in/i }))

    const dialog = screen.getByRole('dialog', { name: 'Delete this check-in?' })
    expect(dialog).toHaveAttribute('open')
    expect(within(dialog).getByText('Good')).toBeInTheDocument()
    expect(within(dialog).getByText('Some')).toBeInTheDocument()
    expect(within(dialog).getByText('Not at all')).toBeInTheDocument()
    expect(within(dialog).queryByText(sampleCheckins[0].note)).not.toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Delete this check-in?' })).not.toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('submits the selected deletion and shows a disabled loading state', async () => {
    let resolveDelete
    const onDelete = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        }),
    )
    render(<CheckInHistoryList checkins={[sampleCheckins[0]]} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: /delete check-in/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete check-in' }))

    expect(onDelete).toHaveBeenCalledWith('c1')
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    await act(async () => resolveDelete())
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Delete this check-in?' })).not.toBeInTheDocument()
    })
  })

  it('keeps the dialog open after a failed delete so the user can retry or cancel', async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error('Delete failed'))
    render(<CheckInHistoryList checkins={[sampleCheckins[0]]} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: /delete check-in/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete check-in' }))

    const dialog = await screen.findByRole('dialog', { name: 'Delete this check-in?' })
    expect(within(dialog).getByRole('button', { name: 'Delete check-in' })).toBeEnabled()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeEnabled()
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
