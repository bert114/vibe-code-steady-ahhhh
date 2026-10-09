import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from './pages/HomePage.jsx'

beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState({}, '', '/')
})

describe('home page', () => {
  it('renders the calm hero and user privacy assurances', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    // Hero
    expect(screen.getByRole('heading', { name: 'Make room for what you need.' })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Three calm mobile app screens/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /cream reflection journal wrapped with an apricot ribbon/i }),
    ).toBeInTheDocument()

    const checkinLink = screen.getByRole('link', { name: /Start a check-in/i })
    expect(checkinLink).toHaveAttribute('href', '/check-in')

    // Privacy & user choice section
    expect(screen.getByRole('heading', { name: 'Your reflections belong only to you' })).toBeInTheDocument()
    const introRow = screen.getByTestId('privacy-intro-row')
    const cardsPanel = screen.getByTestId('privacy-card-panel')
    expect(introRow.nextElementSibling).toBe(cardsPanel)
    expect(introRow.parentElement).toHaveClass('privacy-assurance')
    expect(cardsPanel.parentElement).toBe(introRow.parentElement)
    expect(
      screen.getByText(/view your timeline, export your data, or erase your history/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/pattern awareness, not diagnosis/i)).not.toBeInTheDocument()
    expect(screen.getByText('Export anytime')).toBeInTheDocument()
    expect(screen.getByText('Erase anytime')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Review privacy & settings/i })).toHaveAttribute('href', '/settings')
  })

  it('enables browser-local drag, reorder, and resize controls when edit mode is requested', () => {
    window.history.replaceState({}, '', '/?edit=layout')

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Drag a grip onto the other card to swap sides/i)).toBeInTheDocument()
    const imageHandle = screen.getByRole('button', { name: 'Drag image card to reorder' })
    const privacyCard = screen.getByTestId('privacy-card-proof')
    const dataTransfer = {
      effectAllowed: '',
      setData: vi.fn(),
      getData: vi.fn(() => 'image'),
    }

    fireEvent.dragStart(imageHandle, { dataTransfer })
    fireEvent.dragOver(privacyCard, { dataTransfer })
    fireEvent.drop(privacyCard, { dataTransfer })

    expect(screen.getByTestId('privacy-card-proof').style.order).toBe('0')
    expect(screen.getByTestId('privacy-card-image').style.order).toBe('1')
    expect(JSON.parse(window.localStorage.getItem('steady-ahh-privacy-card-layout')).order)
      .toEqual(['privacy', 'image'])

    const imageCard = screen.getByTestId('privacy-card-image')
    vi.spyOn(imageCard, 'getBoundingClientRect').mockReturnValue({ width: 420, height: 360 })
    fireEvent.pointerUp(imageCard)
    expect(JSON.parse(window.localStorage.getItem('steady-ahh-privacy-card-layout')).sizes.image)
      .toEqual({ width: 420, height: 360 })
  })
})
