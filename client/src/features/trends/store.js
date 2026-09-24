import { create } from 'zustand'
import { getTrends } from '../checkins/api.js'

// Small feature-scoped store: selected window + the trend payload for it.
// Mirrors the insights/checkins stores — no server-state beyond what this
// page renders.
export const useTrendsStore = create((set, get) => ({
  windowDays: 30,
  data: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,

  setWindowDays: (windowDays) => {
    set({ windowDays })
    get().load()
  },

  load: async () => {
    const { windowDays } = get()
    set({ status: 'loading', error: null })
    try {
      const data = await getTrends({ windowDays })
      set({ status: 'succeeded', data })
    } catch (err) {
      set({ status: 'failed', error: err.message })
    }
  },
}))
