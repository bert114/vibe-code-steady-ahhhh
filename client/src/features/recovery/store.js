import { create } from 'zustand'
import { answerBreak, createCustomActivity, getRecoveryState, startBreak } from './api.js'

export const ACTIVITIES = [
  { id: 'breathe', label: 'Breathe slowly', hint: 'Slow, deep breaths to reset tension' },
  { id: 'walk', label: 'Short walk', hint: 'Step away and stretch your legs' },
  { id: 'stretch', label: 'Gentle stretch', hint: 'Release your neck and shoulders' },
  { id: 'water', label: 'Drink some water', hint: 'Hydrate and take a brief pause' },
  { id: 'music', label: 'Calming music', hint: 'Listen to ambient sounds or quiet songs' },
  { id: 'quiet', label: 'Sit quietly', hint: 'Close your eyes with zero demands' },
]

export const DURATIONS = [5, 10, 15]

export function resolveActivity(activityId, customActivities = []) {
  if (!activityId) return null
  const standard = ACTIVITIES.find((a) => a.id === activityId)
  if (standard) return standard
  if (activityId.startsWith('custom:')) {
    const id = activityId.slice(7)
    const custom = customActivities.find((c) => c.id === id)
    if (custom) return { id: activityId, label: custom.name, hint: custom.hint || 'Custom recovery pause' }
  }
  return { id: activityId, label: 'Recovery pause', hint: 'Take a restorative moment' }
}

function dismissalKey(reason, id) {
  const suffix = id || new Date().toISOString().slice(0, 10)
  return `steady-ahh:recovery-dismissed:${reason}:${suffix}`
}

function isDismissed(reason, id) {
  try {
    return Boolean(localStorage.getItem(dismissalKey(reason, id)))
  } catch {
    return false
  }
}

function setDismissed(reason, id) {
  try {
    localStorage.setItem(dismissalKey(reason, id), 'true')
  } catch {
    // Ignore storage errors in restrictive environments
  }
}

export const useRecoveryStore = create((set, get) => ({
  state: {
    activeBreak: null,
    dueBreak: null,
    suggestBreak: null,
    drainingStatus: {
      isDraining: false,
      activity: null,
      drainScore: null,
    },
    activityStats: [],
    customActivities: [],
  },
  status: 'idle', // idle | loading | ready
  pickerOpen: false,
  pickerTrigger: 'latest_checkin',
  pickerCheckinId: null,
  pickerDrainingActivity: null,
  promptOpen: false,
  thankYouMessage: null,
  offerAnotherActivity: false,
  drainingChipDismissed: false,

  refresh: async () => {
    try {
      const data = await getRecoveryState()
      if (!data) return null
      set({ state: data, status: 'ready' })

      const drainingActivity =
        data.suggestBreak?.drainingActivity ||
        data.activeBreak?.drainingActivity ||
        data.dueBreak?.drainingActivity ||
        data.drainingStatus?.activity ||
        null

      // Auto-open picker if latest check-in was drained and hasn't been dismissed
      if (
        data.suggestBreak?.reason === 'latest_checkin' &&
        !isDismissed('latest_checkin', data.suggestBreak.checkinId) &&
        !get().pickerOpen &&
        !data.activeBreak &&
        !data.dueBreak
      ) {
        set({
          pickerOpen: true,
          pickerTrigger: 'latest_checkin',
          pickerCheckinId: data.suggestBreak.checkinId,
          pickerDrainingActivity: drainingActivity,
        })
      }

      // Auto-open prompt if a break is due and prompt isn't already active
      if (data.dueBreak && !get().promptOpen && !get().pickerOpen) {
        set({ promptOpen: true, offerAnotherActivity: false })
      }

      return data
    } catch {
      // Silent fail-open
      return null
    }
  },

  checkActiveTimer: () => {
    const { state, promptOpen, pickerOpen } = get()
    if (!state.activeBreak?.endsAt || promptOpen || pickerOpen) return
    const remaining = new Date(state.activeBreak.endsAt).getTime() - Date.now()
    if (remaining <= 0) {
      set({ promptOpen: true, offerAnotherActivity: false })
    }
  },

  openPicker: (trigger = 'drain_pattern', checkinId = null, drainingActivity = null) => {
    const { state } = get()
    const activity =
      drainingActivity ||
      state.suggestBreak?.drainingActivity ||
      state.drainingStatus?.activity ||
      null
    set({
      pickerOpen: true,
      pickerTrigger: trigger,
      pickerCheckinId: checkinId,
      pickerDrainingActivity: activity,
      offerAnotherActivity: false,
    })
  },

  closePicker: () => {
    const { pickerTrigger, pickerCheckinId } = get()
    setDismissed(pickerTrigger, pickerCheckinId)
    set({ pickerOpen: false })
  },

  beginBreak: async (activity, durationMinutes) => {
    const { pickerTrigger, pickerCheckinId } = get()
    set({ pickerOpen: false, offerAnotherActivity: false })
    try {
      await startBreak({
        activity,
        durationMinutes,
        trigger: pickerTrigger,
        checkinId: pickerCheckinId || undefined,
      })
      await get().refresh()
    } catch {
      // Re-fetch to synchronize state
      await get().refresh()
    }
  },

  openPromptForActive: () => {
    set({ promptOpen: true, offerAnotherActivity: false })
  },

  submitOutcome: async (outcome) => {
    const { state } = get()
    const targetBreak = state.dueBreak || state.activeBreak
    if (!targetBreak) {
      set({ promptOpen: false, offerAnotherActivity: false })
      return
    }

    try {
      await answerBreak(targetBreak.id, outcome)

      // If break didn't fully help, Steady Mind continues suggesting alternative activities
      if (outcome === 'not_really' || outcome === 'a_little') {
        set({
          offerAnotherActivity: true,
          thankYouMessage: null,
        })
        get().refresh()
        return
      }

      set({
        thankYouMessage:
          outcome === 'skipped'
            ? 'No worries. Take care of yourself.'
            : "Thanks for telling me. I'll keep this in mind next time you need a pause.",
        offerAnotherActivity: false,
      })
      setTimeout(() => {
        set({ promptOpen: false, thankYouMessage: null, offerAnotherActivity: false })
        get().refresh()
      }, 1800)
    } catch {
      set({ promptOpen: false, thankYouMessage: null, offerAnotherActivity: false })
      await get().refresh()
    }
  },

  closePrompt: () => {
    set({ promptOpen: false, thankYouMessage: null, offerAnotherActivity: false })
  },

  dismissPatternCard: () => {
    setDismissed('drain_pattern', null)
    set((s) => ({
      state: {
        ...s.state,
        suggestBreak: s.state.suggestBreak?.reason === 'drain_pattern' ? null : s.state.suggestBreak,
      },
    }))
  },

  isPatternDismissed: () => isDismissed('drain_pattern', null),

  dismissDrainingChip: () => {
    set({ drainingChipDismissed: true })
  },

  addCustomActivity: async ({ name, hint = '' }) => {
    try {
      const created = await createCustomActivity({ name, hint })
      await get().refresh()
      return created
    } catch (err) {
      // Refresh to synchronize
      await get().refresh()
      throw err
    }
  },
}))

