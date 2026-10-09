import { create } from 'zustand'
import { useToastStore } from '../../components/ui/toastStore.js'
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
      const fallbackMessage = result.fallback ? (result.message ?? null) : null
      set({
        status: 'succeeded',
        insights: result.insights ?? [],
        lastInsight: result.lastInsight ?? null,
        notice: fallbackMessage,
      })
      if (fallbackMessage) {
        useToastStore.getState().error(fallbackMessage)
      } else {
        useToastStore.getState().success('Analysis complete. Your insights are up to date.')
      }
    } catch (err) {
      set({ status: 'failed', error: err.message })
    }
  },
}))
