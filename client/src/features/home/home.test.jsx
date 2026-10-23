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
    expect(screen.getByRole('heading', { name: 'Understand what you’re feeling.' })).toBeInTheDocument()
    expect(screen.getByText('A private space to check in')).toBeInTheDocument()
    expect(screen.getByText(/Name the moment, notice what repeats, and stay in control/i)).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Three calm mobile app screens/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /cream reflection journal wrapped with an apricot ribbon/i }),
    ).toBeInTheDocument()

    const reflectionLink = screen.getByRole('link', { name: /Begin a reflection/i })
    expect(reflectionLink).toHaveAttribute('href', '/check-in')

    // What Steady-Ahh helps with section
    expect(screen.getByRole('heading', { name: 'What Steady-Ahh helps you do' })).toBeInTheDocument()
    const introRow = screen.getByTestId('privacy-intro-row')
    const cardsPanel = screen.getByTestId('privacy-card-panel')
    expect(introRow.nextElementSibling).toBe(cardsPanel)
    expect(introRow.parentElement).toHaveClass('privacy-assurance')
    expect(cardsPanel.parentElement).toBe(introRow.parentElement)
    expect(
      screen.getByText(/Record what happened, notice what repeats, and decide what to do/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Start with one moment.' })).toBeInTheDocument()
    expect(screen.getByText('A quick check-in is enough.')).toBeInTheDocument()
    expect(screen.queryByText(/pattern awareness, not diagnosis/i)).not.toBeInTheDocument()
    expect(screen.getByText('Check in')).toBeInTheDocument()
    expect(screen.getByText('Notice patterns')).toBeInTheDocument()
    expect(screen.getByText('Reflect on boundaries')).toBeInTheDocument()
    expect(screen.getByText('Control your data')).toBeInTheDocument()
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
