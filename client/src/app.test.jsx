import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './app/App.jsx'

describe('foundation', () => {
  it('renders the landing placeholder with primary navigation', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Steady-Ahh' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })
})
