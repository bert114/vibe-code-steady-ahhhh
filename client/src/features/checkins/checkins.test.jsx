import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import CheckInPage from './pages/CheckInPage.jsx'

describe('check-in page', () => {
  it('renders scores, inputs, save button, and history section', async () => {
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Check-In' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Previous check-ins' })).toBeInTheDocument()
    // 3 score groups x 5 radios.
    expect(screen.getAllByRole('radio')).toHaveLength(15)
    expect(screen.getByLabelText(/emotions/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/what happened/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save check-in/i })).toBeInTheDocument()
  })
})
