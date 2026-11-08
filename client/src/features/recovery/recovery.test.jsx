import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BreakPickerModal from './components/BreakPickerModal.jsx'
import BreakSuggestionCard from './components/BreakSuggestionCard.jsx'
import BreakTimerPill from './components/BreakTimerPill.jsx'
import HelpedPromptModal from './components/HelpedPromptModal.jsx'
import { useRecoveryStore } from './store.js'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('BreakPickerModal', () => {
  it('renders calm distilled recovery modal and allows selecting activity and duration to start break', () => {
    const onStart = vi.fn()
    const onClose = vi.fn()
    render(
      <BreakPickerModal
        open={true}
        trigger="latest_checkin"
        activityStats={[{ activity: 'walk', total: 2, helped: 2 }]}
        onStart={onStart}
        onClose={onClose}
      />,
    )

    // Calm title & lead
    expect(
      screen.getByText('Just a quiet moment to catch your breath.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No performance, no solving anything right now. A few minutes is all it takes to reset.'),
    ).toBeInTheDocument()

    // Activity choices available directly
    expect(screen.getByText('Short walk')).toBeInTheDocument()
    expect(screen.getByText('Helped')).toBeInTheDocument()

    // Select Short walk
    fireEvent.click(screen.getByRole('radio', { name: /short walk/i }))

    // Select 10 min
    fireEvent.click(screen.getByRole('radio', { name: /10 min/i }))

    // Start break
    fireEvent.click(screen.getByRole('button', { name: /start 10-minute short walk/i }))

    expect(onStart).toHaveBeenCalledWith('walk', 10)
  })

  it('closes when the user clicks Not right now or the close button', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <BreakPickerModal
        open={true}
        trigger="latest_checkin"
        activityStats={[]}
        onStart={vi.fn()}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /not right now/i }))
    expect(onClose).toHaveBeenCalledTimes(1)

    // Top-bar close button
    rerender(
      <BreakPickerModal
        open={true}
        trigger="latest_checkin"
        activityStats={[]}
        onStart={vi.fn()}
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /close recovery window/i }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('renders contextual title when drainingActivity is detected', () => {
    render(
      <BreakPickerModal
        open={true}
        trigger="latest_checkin"
        drainingActivity="Work"
        activityStats={[]}
        onStart={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Work has been taking a lot out of you.')).toBeInTheDocument()
  })

  it('allows user to view and add a custom activity for future reference', () => {
    const onAdd = vi.fn().mockResolvedValue({ id: 'custom-1', name: 'Pet my cat' })
    render(
      <BreakPickerModal
        open={true}
        trigger="latest_checkin"
        activityStats={[]}
        customActivities={[{ id: 'custom-1', name: 'Pet my cat', hint: 'Spend time with pets' }]}
        onStart={vi.fn()}
        onClose={vi.fn()}
        onAddCustomActivity={onAdd}
      />,
    )

    // User's custom activity is displayed in the list
    expect(screen.getByText('Pet my cat')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()

    // Can toggle add custom activity form
    fireEvent.click(screen.getByRole('button', { name: /\+ add your own activity/i }))
    expect(screen.getByLabelText(/activity name/i)).toBeInTheDocument()
  })
})

describe('BreakTimerPill', () => {
  it('renders active break with remaining time and triggers end early', () => {
    const onEndEarly = vi.fn()
    const future = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    render(
      <BreakTimerPill
        activeBreak={{
          id: 'b1',
          activity: 'walk',
          durationMinutes: 5,
          endsAt: future,
        }}
        onEndEarly={onEndEarly}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByText('Short walk')).toBeInTheDocument()
    expect(screen.getByText(/left/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /i'm back early/i }))
    expect(onEndEarly).toHaveBeenCalled()
  })
})

describe('HelpedPromptModal', () => {
  it('asks whether the activity helped and captures outcome choices', () => {
    const onSubmit = vi.fn()
    const onSkip = vi.fn()
    render(
      <HelpedPromptModal
        open={true}
        targetBreak={{ id: 'b1', activity: 'walk' }}
        thankYouMessage={null}
        onSubmit={onSubmit}
        onSkip={onSkip}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(/did the short walk help\?/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /helped/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /a little/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /not really/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /helped/i }))
    expect(onSubmit).toHaveBeenCalledWith('helped')
  })

  it('supports skipping the prompt', () => {
    const onSkip = vi.fn()
    render(
      <HelpedPromptModal
        open={true}
        targetBreak={{ id: 'b1', activity: 'stretch' }}
        thankYouMessage={null}
        onSubmit={vi.fn()}
        onSkip={onSkip}
        onClose={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('renders a calm thank you message after answering', () => {
    render(
      <HelpedPromptModal
        open={true}
        targetBreak={{ id: 'b1', activity: 'stretch' }}
        thankYouMessage="Thanks for telling me. I'll keep this in mind next time you need a pause."
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Pause recorded')).toBeInTheDocument()
    expect(
      screen.getByText("Thanks for telling me. I'll keep this in mind next time you need a pause."),
    ).toBeInTheDocument()
    expect(screen.getByText('Saved to your personal recovery history')).toBeInTheDocument()
  })

  it('offers another activity when break did not fully help', () => {
    const onTryAnother = vi.fn()
    render(
      <HelpedPromptModal
        open={true}
        targetBreak={{ id: 'b1', activity: 'walk' }}
        thankYouMessage={null}
        offerAnotherActivity={true}
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
        onClose={vi.fn()}
        onTryAnother={onTryAnother}
      />,
    )

    expect(screen.getByText('Would you like to try another activity?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /try another activity/i }))
    expect(onTryAnother).toHaveBeenCalled()
  })
})

describe('BreakSuggestionCard', () => {
  it('renders on the dashboard when a drain pattern is detected', () => {
    useRecoveryStore.setState({
      state: {
        activeBreak: null,
        dueBreak: null,
        suggestBreak: { reason: 'drain_pattern', checkinId: null },
        activityStats: [],
      },
    })

    render(<BreakSuggestionCard />)
    expect(screen.getByText(/care observation/i)).toBeInTheDocument()
    expect(screen.getByText('A few draining days have shown up lately')).toBeInTheDocument()

    // Dismissal hides the card
    fireEvent.click(screen.getByRole('button', { name: /not now/i }))
    expect(screen.queryByText('A few draining days have shown up lately')).not.toBeInTheDocument()
  })
})
