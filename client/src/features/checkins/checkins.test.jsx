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

    // Step 1 of 4: mood — only that question's 5 options are on screen.
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /mood/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    fireEvent.click(screen.getByRole('radio', { name: 'Good' }))

    // Step 2 of 4: energy.
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /energy/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    fireEvent.click(screen.getByRole('radio', { name: 'Energized' }))

    // Step 3 of 4: drain.
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /draining/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Mild' }))

    // Step 4 of 4: a summary of the answers, optional details, and save.
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument()
    expect(screen.getByText(/mood 4 · energy 4 · drain 2/i)).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('radio', { name: 'Good' })) // mood -> step 2
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Good' })).toBeChecked()
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
