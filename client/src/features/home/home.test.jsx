import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HomePage from './pages/HomePage.jsx'

describe('home page', () => {
  it('renders the calm hero section, core pillars, and call-to-actions', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    // Hero title & lead
    expect(
      screen.getByRole('heading', { name: /Make sense of what.*weighing on you/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /person-led homepage photograph/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Illustrative example · synthetic entries/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Record how you feel, notice what tends to drain you/i),
    ).toBeInTheDocument()

    // Action buttons
    const checkinLink = screen.getByRole('link', { name: /Take a 30-second check-in/i })
    expect(checkinLink).toHaveAttribute('href', '/check-in')

    const dashboardLink = screen.getByRole('link', { name: /Open dashboard/i })
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')

    // Core Pillars
    expect(screen.getByRole('heading', { name: 'Daily Energy Check-In' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pattern Recognition' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Boundary Awareness' })).toBeInTheDocument()

    // Privacy & Sovereignty section
    expect(
      screen.getByRole('heading', { name: 'Your reflections belong only to you' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Review privacy & settings/i })).toHaveAttribute(
      'href',
      '/settings',
    )
  })
})
