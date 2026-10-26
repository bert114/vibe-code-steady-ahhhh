import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CheckInForm from './components/CheckInForm.jsx'
import CheckInPage from './pages/CheckInPage.jsx'

// The check-in uses three ratings; optional details are offered after them.
describe('Check-in page', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>,
    )
  }

  function finishRatings() {
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue to save/i }))
  }

  it('keeps the flow to three numbered questions and opens optional save choices in a modal', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'How are you feeling today?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Past reflections' })).toBeInTheDocument()

    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Check-in progress' })).toHaveAttribute('aria-valuemax', '3')
    expect(screen.getByRole('radiogroup', { name: /mood/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    fireEvent.click(screen.getByRole('radio', { name: 'Good' }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))

    expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /energy/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    fireEvent.click(screen.getByRole('radio', { name: 'A lot' }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))

    expect(screen.getByText('Question 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /drained/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'A lot' }))
    fireEvent.click(screen.getByRole('button', { name: /continue to save/i }))

    const progress = screen.getByRole('progressbar', { name: 'Check-in progress' })
    expect(progress).toHaveAttribute('aria-valuenow', '3')
    expect(progress).toHaveAttribute('aria-valuetext', 'Question 3 of 3: Feeling drained')
    expect(screen.queryByText(/step 4/i)).not.toBeInTheDocument()

    const dialog = screen.getByRole('dialog', { name: /add details/i })
    expect(dialog).toHaveAttribute('open')
    expect(screen.getByRole('button', { name: 'Save without details' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add details' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add details' }))
    expect(screen.getByRole('dialog', { name: 'Which words describe your feelings?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Which words describe your feelings?' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    fireEvent.change(screen.getByRole('textbox', { name: 'Which words describe your feelings?' }), { target: { value: 'hopeful' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('dialog', { name: 'What was happening?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'What was happening?' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Skip this' }))
    expect(screen.getByRole('dialog', { name: 'Add a note' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Add a note' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Save check-in' })).toBeInTheDocument()
  })

  it('lets the user save the three ratings without adding personal details', () => {
    const onSubmit = vi.fn()
    render(<CheckInForm onSubmit={onSubmit} saving={false} />)

    finishRatings()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save without details' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('lets the user return from the optional modal to the third question', () => {
    renderPage()
    finishRatings()

    fireEvent.click(screen.getByRole('button', { name: 'Close save options' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Question 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /drained/i })).toBeInTheDocument()
  })

  it('lets the user step back and change an earlier answer', () => {
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Good' }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Good' })).toBeChecked()
  })

  it('lets Continue accept the current default without picking a new value', () => {
    renderPage()
    expect(screen.getByRole('radio', { name: 'Okay' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
  })

  it('does not auto-save from optional fields or Enter; only an explicit save does', () => {
    const onSubmit = vi.fn()
    const { container } = render(<CheckInForm onSubmit={onSubmit} saving={false} />)
    finishRatings()
    fireEvent.click(screen.getByRole('button', { name: 'Add details' }))

    const emotions = screen.getByRole('textbox', { name: 'Which words describe your feelings?' })
    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    expect(fireEvent.keyDown(emotions, { key: 'Enter', code: 'Enter', charCode: 13 })).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Skip this' }))

    const context = screen.getByRole('textbox', { name: 'What was happening?' })
    expect(fireEvent.keyDown(context, { key: 'Enter', code: 'Enter', charCode: 13 })).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Skip this' }))

    const note = screen.getByRole('textbox', { name: 'Add a note' })
    expect(fireEvent.keyDown(note, { key: 'Enter', code: 'Enter', charCode: 13 })).toBe(true)
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.submit(container.querySelector('form'))
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.change(note, { target: { value: 'A small reminder to myself.' } })
    const saveButton = screen.getByRole('button', { name: 'Save check-in' })
    expect(saveButton).toHaveAttribute('type', 'button')
    fireEvent.click(saveButton)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('matches energy icons to energy captions, not mood faces', () => {
    const { container } = renderPage()
    expect(container.querySelectorAll('.score-option__face')).toHaveLength(3)
    expect(container.querySelector('.score-option__icon')).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: 'Good' }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    expect(screen.getByRole('radiogroup', { name: /energy/i })).toBeInTheDocument()
    const batteries = container.querySelectorAll('.score-option__icon')
    expect(batteries).toHaveLength(3)
    batteries.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'))
    expect(container.querySelector('.score-option__face')).toBeNull()
    expect(screen.getByRole('radio', { name: 'A lot' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Very little' })).toBeInTheDocument()
  })

  it('matches drain icons to drain captions, not mood faces', () => {
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    expect(screen.getByRole('radiogroup', { name: /drained/i })).toBeInTheDocument()
    const drops = container.querySelectorAll('.score-option__icon')
    expect(drops).toHaveLength(3)
    drops.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'))
    expect(container.querySelector('.score-option__face')).toBeNull()
    expect(screen.getByRole('radio', { name: 'A lot' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Not at all' })).toBeInTheDocument()
  })
})
