import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './app/App.jsx'

describe('foundation', () => {
  it('renders the landing page with primary navigation', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /Notice your patterns. Honor your energy./i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How Steady-Ahh works' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })
})
