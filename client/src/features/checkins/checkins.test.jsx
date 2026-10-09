import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CheckInForm from './components/CheckInForm.jsx'
import CheckInPage from './pages/CheckInPage.jsx'

// The reflection flow counts only Mood, Energy, and Drain. Optional personal
// details are offered in a separate modal after those three decisions.
describe('Daily Reflection', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>,
    )
  }

  function finishRatings() {
    fireEvent.click(screen.getByRole('button', { name: /continue to energy/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue to drain/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue to save/i }))
  }

  it('keeps the flow to three numbered questions and opens optional save choices in a modal', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'A brief moment to check in.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Previous check-ins' })).toBeInTheDocument()

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Check-in progress' })).toHaveAttribute('aria-valuemax', '3')
    expect(screen.getByRole('radiogroup', { name: /mood/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    fireEvent.click(screen.getByRole('radio', { name: 'Great' }))
    fireEvent.click(screen.getByRole('button', { name: /continue to energy/i }))

    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /energy/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    fireEvent.click(screen.getByRole('radio', { name: 'Full tank' }))
    fireEvent.click(screen.getByRole('button', { name: /continue to drain/i }))

    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /draining/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Overwhelming' }))
    fireEvent.click(screen.getByRole('button', { name: /continue to save/i }))

    const progress = screen.getByRole('progressbar', { name: 'Check-in progress' })
    expect(progress).toHaveAttribute('aria-valuenow', '3')
    expect(progress).toHaveAttribute('aria-valuetext', 'Step 3 of 3: Drain')
    expect(screen.queryByText(/step 4/i)).not.toBeInTheDocument()

    const dialog = screen.getByRole('dialog', { name: /add personal details/i })
    expect(dialog).toHaveAttribute('open')
    expect(screen.getByRole('button', { name: 'Save now' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add personal details' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add personal details' }))
    expect(screen.getByRole('dialog', { name: 'What words fit how you feel?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'What words fit how you feel?' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    fireEvent.change(screen.getByRole('textbox', { name: 'What words fit how you feel?' }), { target: { value: 'hopeful' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('dialog', { name: 'What was going on?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'What was going on?' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByRole('dialog', { name: 'Anything you’d like to remember?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Anything you’d like to remember?' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Skip & save' })).toBeInTheDocument()
  })

  it('lets the user save the three ratings without adding personal details', () => {
    const onSubmit = vi.fn()
    render(<CheckInForm onSubmit={onSubmit} saving={false} />)

    finishRatings()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save now' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('lets the user return from the optional modal to the third question', () => {
    renderPage()
    finishRatings()

    fireEvent.click(screen.getByRole('button', { name: 'Close save options' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /draining/i })).toBeInTheDocument()
  })

  it('lets the user step back and change an earlier answer', () => {
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Great' }))
    fireEvent.click(screen.getByRole('button', { name: /continue to energy/i }))
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Great' })).toBeChecked()
  })

  it('lets Continue accept the current default without picking a new value', () => {
    renderPage()
    expect(screen.getByRole('radio', { name: 'Okay' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: /continue to energy/i }))
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
  })

  it('does not auto-save from optional fields or Enter; only an explicit save does', () => {
    const onSubmit = vi.fn()
    const { container } = render(<CheckInForm onSubmit={onSubmit} saving={false} />)
    finishRatings()
    fireEvent.click(screen.getByRole('button', { name: 'Add personal details' }))

    const emotions = screen.getByRole('textbox', { name: 'What words fit how you feel?' })
    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    expect(fireEvent.keyDown(emotions, { key: 'Enter', code: 'Enter', charCode: 13 })).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    const context = screen.getByRole('textbox', { name: 'What was going on?' })
    expect(fireEvent.keyDown(context, { key: 'Enter', code: 'Enter', charCode: 13 })).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    const note = screen.getByRole('textbox', { name: 'Anything you’d like to remember?' })
    expect(fireEvent.keyDown(note, { key: 'Enter', code: 'Enter', charCode: 13 })).toBe(true)
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.submit(container.querySelector('form'))
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.change(note, { target: { value: 'A small reminder to myself.' } })
    const saveButton = screen.getByRole('button', { name: 'Save reflection' })
    expect(saveButton).toHaveAttribute('type', 'button')
    fireEvent.click(saveButton)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('matches energy icons to energy captions, not mood faces', () => {
    const { container } = renderPage()
    expect(container.querySelectorAll('.score-option__face')).toHaveLength(3)
    expect(container.querySelector('.score-option__icon')).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: 'Great' }))
    fireEvent.click(screen.getByRole('button', { name: /continue to energy/i }))
    expect(screen.getByRole('radiogroup', { name: /energy/i })).toBeInTheDocument()
    const batteries = container.querySelectorAll('.score-option__icon')
    expect(batteries).toHaveLength(3)
    batteries.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'))
    expect(container.querySelector('.score-option__face')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Full tank' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Running on empty' })).toBeInTheDocument()
  })

  it('matches drain icons to drain captions, not mood faces', () => {
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continue to energy/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue to drain/i }))
    expect(screen.getByRole('radiogroup', { name: /draining/i })).toBeInTheDocument()
    const drops = container.querySelectorAll('.score-option__icon')
    expect(drops).toHaveLength(3)
    drops.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'))
    expect(container.querySelector('.score-option__face')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Overwhelming' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Light' })).toBeInTheDocument()
  })
})
