import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './app/App.jsx'

describe('foundation', () => {
  it('renders the public landing page: brand, Home + Sign in, and account access only', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Understand what you’re feeling.' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Workspace' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Steady-Ahh home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
    // Private destinations must never be advertised to a signed-out visitor.
    expect(screen.queryByRole('link', { name: 'Wellbeing overview' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Daily reflection' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Past reflections' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Patterns & boundaries' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Privacy & settings' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profile options' })).toBeInTheDocument()
    // Account lives in the topbar now; the sidebar footer is note-only so it
    // can never overlap or clip the account menu at short viewport heights.
    expect(document.querySelector('#workspace-topbar-account-landing')).toBeInTheDocument()
    expect(screen.queryByText('Your account')).not.toBeInTheDocument()
  })

  it('toggles the sidebar into its collapsed layout state', () => {
    window.localStorage.setItem('steady-ahh:workspace-sidebar-collapsed', 'false')
    render(<App />)

    const shell = document.querySelector('.app-shell--workspace')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(shell).toHaveClass('is-collapsed')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
  })
})
