import { create } from 'zustand'
import { getDashboardSummary, markReminderRead } from './api.js'

// Small feature-scoped store: dashboard summary + reminder read state.
export const useDashboardStore = create((set, get) => ({
  summary: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  markingId: null,

  load: async () => {
    set({ status: 'loading', error: null })
    try {
      const summary = await getDashboardSummary()
      set({ status: 'succeeded', summary })
    } catch (err) {
      set({ status: 'failed', error: err.message })
    }
  },

  markRead: async (id) => {
    const prev = get().summary
    if (!prev) return
    const target = prev.reminders.find((r) => r.id === id)
    if (!target || target.readAt) return
    set({ markingId: id, error: null })
    // Optimistic: mark locally, roll back if the server disagrees.
    const optimistic = {
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.id === id ? { ...r, readAt: new Date().toISOString() } : r,
      ),
      unreadReminders: Math.max(0, prev.unreadReminders - 1),
    }
    set({ summary: optimistic })
    try {
      const updated = await markReminderRead(id)
      set((state) => ({
        summary: {
          ...state.summary,
          reminders: state.summary.reminders.map((r) => (r.id === id ? updated : r)),
        },
      }))
    } catch (err) {
      set({ summary: prev, error: err.message })
    } finally {
      set({ markingId: null })
    }
  },
}))
