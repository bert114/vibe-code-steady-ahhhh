import { create } from 'zustand'
import { useToastStore } from '../../components/ui/toastStore.js'
import { analyzeInsights, getInsights } from './api.js'

// Small feature-scoped store: insight list + analysis request state.
export const useInsightsStore = create((set) => ({
  insights: [],
  lastInsight: null,
  totalCheckins: null,
  firstCheckinAt: null,
  weeklyDrain: null,
  weeklyBurnout: null,
  status: 'idle', // idle | loading | analyzing | succeeded | failed
  notice: null,
  error: null,

  load: async () => {
    set({ status: 'loading', error: null, notice: null })
    try {
      const { insights, totalCheckins, firstCheckinAt, weeklyDrain, weeklyBurnout } =
        await getInsights()
      set({
        status: 'succeeded',
        insights,
        totalCheckins: totalCheckins ?? null,
        firstCheckinAt: firstCheckinAt ?? null,
        weeklyDrain: weeklyDrain ?? null,
        weeklyBurnout: weeklyBurnout ?? null,
      })
    } catch (err) {
      set({ status: 'failed', error: err.message })
    }
  },

  analyze: async () => {
    set({ status: 'analyzing', error: null, notice: null })
    try {
      const result = await analyzeInsights()
      const fallbackMessage = result.fallback ? (result.message ?? null) : null
      set((state) => ({
        status: 'succeeded',
        insights: result.insights ?? [],
        lastInsight: result.lastInsight ?? null,
        totalCheckins: result.totalCheckins ?? state.totalCheckins,
        firstCheckinAt: result.firstCheckinAt ?? state.firstCheckinAt,
        weeklyDrain: result.weeklyDrain ?? state.weeklyDrain,
        weeklyBurnout: result.weeklyBurnout ?? state.weeklyBurnout,
        notice: fallbackMessage,
      }))
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
