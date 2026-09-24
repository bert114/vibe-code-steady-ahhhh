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
      screen.getByRole('heading', { name: /Notice your patterns. Honor your energy./i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Steady-Ahh helps you understand where your energy goes/i),
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
