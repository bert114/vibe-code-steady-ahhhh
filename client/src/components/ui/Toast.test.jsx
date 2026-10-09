import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ToastStack from './Toast.jsx'
import { TOAST_MAX_DETAILS, useToastStore } from './toastStore.js'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  // No globals: true in vite.config.js, so RTL auto-cleanup never registers.
  cleanup()
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  useToastStore.getState().clear()
})

describe('toast store + stack', () => {
  it('renders a success toast with role=status', () => {
    useToastStore.getState().success('Saved. Thank you for checking in.')
    render(<ToastStack />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/saved/i)
    expect(status.className).toMatch(/toast--success/)
  })

  it('renders an error toast with role=alert plus validation details', () => {
    useToastStore.getState().error('The request could not be validated.', [
      { path: 'energy_score', message: 'Score must be one of 1, 3, or 5.' },
      'drain_score: expected number',
    ])
    render(<ToastStack />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/could not be validated/i)
    expect(alert).toHaveTextContent(/energy_score/)
    expect(alert).toHaveTextContent(/drain_score/)
  })

  it(`shows at most ${TOAST_MAX_DETAILS} details plus a remainder count`, () => {
    useToastStore
      .getState()
      .error('Bad request.', ['one', 'two', 'three', 'four', 'five'])
    render(<ToastStack />)
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('three')).toBeInTheDocument()
    expect(screen.queryByText('four')).not.toBeInTheDocument()
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('auto-dismisses after the TTL', () => {
    useToastStore.getState().success('Done.')
    render(<ToastStack />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('dismisses via the close button', () => {
    useToastStore.getState().error('Offline.')
    render(<ToastStack />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss notification/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('caps the stack at three toasts, dropping the oldest', () => {
    const { push } = useToastStore.getState()
    push({ kind: 'success', message: 'first' })
    push({ kind: 'success', message: 'second' })
    push({ kind: 'success', message: 'third' })
    push({ kind: 'success', message: 'fourth' })
    render(<ToastStack />)
    expect(screen.queryByText('first')).not.toBeInTheDocument()
    expect(screen.getByText('fourth')).toBeInTheDocument()
    expect(useToastStore.getState().toasts).toHaveLength(3)
  })

  it('renders nothing when the stack is empty', () => {
    const { container } = render(<ToastStack />)
    expect(container).toBeEmptyDOMElement()
  })
})
