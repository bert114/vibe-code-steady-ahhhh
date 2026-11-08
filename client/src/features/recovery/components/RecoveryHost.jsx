import { SignedIn } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { clerkEnabled, useClerkActive } from '../../../app/auth.jsx'
import { useRecoveryStore } from '../store.js'
import BreakPickerModal from './BreakPickerModal.jsx'
import BreakTimerPill from './BreakTimerPill.jsx'
import DrainingActivityIndicator from './DrainingActivityIndicator.jsx'
import HelpedPromptModal from './HelpedPromptModal.jsx'

function RecoveryHostCore() {
  const location = useLocation()
  const {
    state,
    pickerOpen,
    pickerTrigger,
    pickerDrainingActivity,
    promptOpen,
    thankYouMessage,
    offerAnotherActivity,
    drainingChipDismissed,
    refresh,
    checkActiveTimer,
    beginBreak,
    openPicker,
    closePicker,
    openPromptForActive,
    submitOutcome,
    closePrompt,
    dismissDrainingChip,
    addCustomActivity,
  } = useRecoveryStore()

  // Sync state on mount and on any page navigation
  useEffect(() => {
    refresh()
  }, [location.pathname, refresh])

  // Continually check active break timer so the follow-up prompt triggers
  // on any page the instant the break duration concludes
  useEffect(() => {
    const timer = setInterval(() => {
      checkActiveTimer()
    }, 1000)
    return () => clearInterval(timer)
  }, [checkActiveTimer])

  const targetBreak = state.dueBreak || state.activeBreak
  const drainingActivity =
    pickerDrainingActivity ||
    targetBreak?.drainingActivity ||
    state.suggestBreak?.drainingActivity ||
    state.drainingStatus?.activity ||
    null

  const showDrainingChip = Boolean(
    state.drainingStatus?.isDraining &&
    drainingActivity &&
    !state.activeBreak &&
    !pickerOpen &&
    !promptOpen &&
    !drainingChipDismissed,
  )

  return (
    <>
      {showDrainingChip && (
        <DrainingActivityIndicator
          drainingActivity={drainingActivity}
          onOpenSuggestions={() => openPicker('draining_state', null, drainingActivity)}
          onDismiss={dismissDrainingChip}
        />
      )}

      <BreakPickerModal
        open={pickerOpen}
        trigger={pickerTrigger}
        drainingActivity={drainingActivity}
        activityStats={state.activityStats}
        customActivities={state.customActivities}
        onStart={beginBreak}
        onClose={closePicker}
        onAddCustomActivity={addCustomActivity}
      />

      <BreakTimerPill
        activeBreak={state.activeBreak}
        onEndEarly={openPromptForActive}
        onComplete={openPromptForActive}
      />

      <HelpedPromptModal
        open={promptOpen}
        targetBreak={targetBreak}
        drainingActivity={drainingActivity}
        thankYouMessage={thankYouMessage}
        offerAnotherActivity={offerAnotherActivity}
        onSubmit={submitOutcome}
        onSkip={() => submitOutcome('skipped')}
        onClose={closePrompt}
        onTryAnother={() => {
          closePrompt()
          openPicker('follow_up', null, drainingActivity)
        }}
      />
    </>
  )
}

export default function RecoveryHost() {
  const clerkActive = useClerkActive()

  // When Clerk authentication is enabled, gate recovery triggers so they run
  // only when the user is signed in. In local dev bypass (no keys), run directly.
  if (clerkEnabled && clerkActive) {
    return (
      <SignedIn>
        <RecoveryHostCore />
      </SignedIn>
    )
  }

  return <RecoveryHostCore />
}
