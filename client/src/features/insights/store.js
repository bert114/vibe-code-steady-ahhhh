import { create } from 'zustand'
import { analyzeInsights, getInsights } from './api.js'

// Small feature-scoped store: insight list + analysis request state.
export const useInsightsStore = create((set) => ({
  insights: [],
  lastInsight: null,
  status: 'idle', // idle | loading | analyzing | succeeded | failed
  notice: null,
  error: null,

  load: async () => {
    set({ status: 'loading', error: null, notice: null })
    try {
      const { insights } = await getInsights()
      set({ status: 'succeeded', insights })
    } catch (err) {
      set({ status: 'failed', error: err.message })
    }
  },

  analyze: async () => {
    set({ status: 'analyzing', error: null, notice: null })
    try {
      const result = await analyzeInsights()
      set({
        status: 'succeeded',
        insights: result.insights ?? [],
        lastInsight: result.lastInsight ?? null,
        notice: result.fallback ? (result.message ?? null) : null,
      })
    } catch (err) {
      set({ status: 'failed', error: err.message })
    }
  },
}))
