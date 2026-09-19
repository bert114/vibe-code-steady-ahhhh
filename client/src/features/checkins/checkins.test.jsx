import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import CheckInPage from './pages/CheckInPage.jsx'
import { useCheckinsStore } from './store.js'

afterEach(() => cleanup())

function renderPage() {
  return render(
    <MemoryRouter>
      <CheckInPage />
    </MemoryRouter>,
  )
}

describe('check-in page stepper', () => {
  beforeEach(() => {
    useCheckinsStore.setState(() => ({
      draft: {
        moodScore: 3,
        energyScore: 3,
        drainScore: 3,
        emotions: '',
        contextTags: '',
        note: '',
      },
      checkins: [],
      status: 'idle',
      error: null,
      justSaved: false,
    }))
  })

  function goToContext() {
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
  }

  it('shows one question at a time starting with mood', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Check-In' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Previous check-ins' })).toBeInTheDocument()
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /how are you feeling/i }),
    ).toBeInTheDocument()

    // Only mood radios visible on step 1.
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save check-in/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/emotions/i)).not.toBeInTheDocument()
  })

  it('walks through energy, drain, context, then review with save', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /how is your energy/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/step 3 of 5/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /how drained/i }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/step 4 of 5/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /what was going on/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/emotions/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/what happened/i)).toBeInTheDocument()
    // Context step never saves directly.
    expect(screen.queryByRole('button', { name: /save check-in/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/step 5 of 5/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /does this look right/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save check-in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('back returns to the previous question', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /how are you feeling/i }),
    ).toBeInTheDocument()
  })

  it('progress shows labeled nodes with current step marked', async () => {
    renderPage()

    const progress = screen.getByRole('list', { name: /check-in progress/i })
    expect(progress).toBeInTheDocument()
    const nodes = within(progress).getAllByRole('listitem')
    expect(nodes).toHaveLength(5)
    expect(nodes[0]).toHaveAttribute('aria-current', 'step')
    expect(nodes[0]).toHaveAccessibleName(/mood \(current\)/i)

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/step 3 of 5/i)).toBeInTheDocument()
    const updated = within(
      screen.getByRole('list', { name: /check-in progress/i }),
    ).getAllByRole('listitem')
    expect(updated[0]).toHaveAccessibleName(/mood \(completed\)/i)
    expect(updated[1]).toHaveAccessibleName(/energy \(completed\)/i)
    expect(updated[2]).toHaveAccessibleName(/drain \(current\)/i)
  })

  it('review collapses empty optionals and shows captions', async () => {
    renderPage()
    goToContext()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/step 5 of 5/i)).toBeInTheDocument()

    // Default draft has empty optionals: no Emotions/Tags/Note rows.
    expect(screen.queryByText('Emotions')).not.toBeInTheDocument()
    expect(screen.queryByText('Tags')).not.toBeInTheDocument()
    expect(screen.queryByText('Note')).not.toBeInTheDocument()
    // Scores show caption words, not bare digits.
    expect(screen.getAllByText('Okay')).toHaveLength(2)
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save check-in/i })).toBeInTheDocument()
  })

  it('long notes truncate with ellipsis but short notes render fully', async () => {
    const longNote = `n${'o'.repeat(150)}te`
    useCheckinsStore.setState((s) => ({
      ...s,
      draft: { ...s.draft, note: longNote },
    }))
    renderPage()
    goToContext()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/step 5 of 5/i)).toBeInTheDocument()

    const truncated = screen.getByTitle(longNote)
    expect(truncated.textContent).toMatch(/\.\.\.$/)
    expect(truncated.textContent.length).toBeLessThan(longNote.length)
  })

  it('enter in context inputs stays editing instead of auto-saving', async () => {
    renderPage()
    goToContext()
    expect(screen.getByText(/step 4 of 5/i)).toBeInTheDocument()

    const emotions = screen.getByLabelText(/emotions/i)
    fireEvent.keyDown(emotions, { key: 'Enter', code: 'Enter', charCode: 13 })
    fireEvent.submit(emotions.closest('form'))

    // Still on context step, still editing, no save button yet.
    expect(screen.getByText(/step 4 of 5/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/emotions/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save check-in/i })).not.toBeInTheDocument()
  })
})
