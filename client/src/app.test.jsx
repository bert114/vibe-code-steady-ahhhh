import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './app/App.jsx'

describe('foundation', () => {
  it('renders the landing page with sidebar navigation and account access', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Make room for what you need.' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Workspace' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Steady-Ahh home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Daily Reflection' })).toHaveAttribute('href', '/check-in')
    expect(screen.getByRole('link', { name: 'Reflection History' })).toHaveAttribute('href', '/check-in#history-heading')
    expect(screen.getByRole('link', { name: 'Personal Insights' })).toHaveAttribute('href', '/insights')
    expect(screen.getByRole('link', { name: 'Profile & Settings' })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('button', { name: 'Profile options' })).toBeInTheDocument()
    // Account lives in the topbar now; the sidebar footer is note-only so it
    // can never overlap or clip the account menu at short viewport heights.
    expect(document.querySelector('.workspace-topbar__account')).toBeInTheDocument()
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
