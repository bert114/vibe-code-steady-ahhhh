import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import InsightsPage from './pages/InsightsPage.jsx'

describe('insights page', () => {
  it('renders the analyze trigger and handles the unreachable-server state', async () => {
    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Insights' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /analyze my recent check-ins/i }),
    ).toBeInTheDocument()
    // No API in the test env: the error contract surfaces via role=alert.
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
