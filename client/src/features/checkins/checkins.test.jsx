import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import CheckInPage from './pages/CheckInPage.jsx'

// The check-in flow is a stepper: one question at a time, advancing
// automatically on selection, landing on an optional-details step before
// saving. These tests walk the same path a person would.
describe('check-in page', () => {
  it('walks through mood, energy, and drain one at a time, then shows the save step', () => {
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Check-In' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Previous check-ins' })).toBeInTheDocument()

    // Step 1 of 4: mood — only that question's 3 options are on screen.
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /mood/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    fireEvent.click(screen.getByRole('radio', { name: 'Great' }))

    // Step 2 of 4: energy (default is Steady, so pick a different value to advance).
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /energy/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    fireEvent.click(screen.getByRole('radio', { name: 'Full tank' }))

    // Step 3 of 4: drain.
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /draining/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Overwhelming' }))

    // Step 4 of 4: a summary of the answers, optional details, and save.
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument()
    expect(screen.getByText(/mood 5 · energy 5 · drain 5/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/emotions/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/anything else/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save check-in/i })).toBeInTheDocument()
  })

  it('lets the user step back and change an earlier answer', () => {
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Great' })) // mood -> step 2
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Great' })).toBeChecked()
  })

  it('lets "Next" accept the current default without picking a new value', () => {
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>,
    )

    // Default mood is 3 ("Okay") — Next should move on without a click on a radio.
    expect(screen.getByRole('radio', { name: 'Okay' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
  })
})

describe('check-in stepper redesign', () => {
  function renderPage() {
    const { container } = render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>,
    )
    return container
  }

  it('shows stroked face icons instead of numbers, with captions as names', () => {
    const container = renderPage()
    const faces = container.querySelectorAll('.score-option__face')
    expect(faces).toHaveLength(3)
    faces.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.querySelector('circle')).not.toBeNull()
    })
    container.querySelectorAll('.score-option').forEach((label) => {
      expect(label.textContent).not.toMatch(/\d/)
    })
    expect(screen.queryByText('🔋')).not.toBeInTheDocument()
  })

  it('tracks progress in a vertical step list with aria-current', () => {
    renderPage()
    const nav = screen.getByRole('navigation', { name: 'Check-in steps' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    const current = document.querySelector('[aria-current="step"]')
    expect(current?.textContent).toMatch(/Mood/)

    fireEvent.click(screen.getByRole('radio', { name: 'Great' }))
    expect(document.querySelector('[aria-current="step"]')?.textContent).toMatch(/Energy/)
  })

  it('lets completed steps jump back via the step list', () => {
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Great' }))
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Mood/ }))
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Great' })).toBeChecked()
  })

  it('matches energy icons to energy captions, not mood faces', () => {
    const container = renderPage()
    // Mood step: faces.
    expect(container.querySelectorAll('.score-option__face')).toHaveLength(3)
    expect(container.querySelector('.score-option__icon')).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: 'Great' }))
    // Energy step: battery levels with energy captions.
    expect(screen.getByRole('radiogroup', { name: /energy/i })).toBeInTheDocument()
    const batteries = container.querySelectorAll('.score-option__icon')
    expect(batteries).toHaveLength(3)
    batteries.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true')
    })
    expect(container.querySelector('.score-option__face')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Full tank' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Running on empty' })).toBeInTheDocument()
    expect(container.querySelector('.score-option__face')).toBeNull()
  })

  it('matches drain icons to drain captions, not mood faces', () => {
    const container = renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Great' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Full tank' }))
    expect(screen.getByRole('radiogroup', { name: /draining/i })).toBeInTheDocument()
    const drops = container.querySelectorAll('.score-option__icon')
    expect(drops).toHaveLength(3)
    drops.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true')
    })
    expect(container.querySelector('.score-option__face')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Overwhelming' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Light' })).toBeInTheDocument()
  })
})
