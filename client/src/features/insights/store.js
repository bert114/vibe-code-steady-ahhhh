import { create } from 'zustand'
import { useToastStore } from '../../components/ui/toastStore.js'
import { analyzeInsights, getInsights } from './api.js'

// Small feature-scoped store: pattern & boundary list + analysis request state.
export const useInsightsStore = create((set) => ({
  insights: [],
  lastInsight: null,
  totalCheckins: null,
  firstCheckinAt: null,
  weeklyDrain: null,
  weeklyBurnout: null,
  periods: null,
  status: 'idle', // idle | loading | analyzing | succeeded | failed
  notice: null,
  error: null,

  load: async () => {
    set({ status: 'loading', error: null, notice: null })
    try {
      const { insights, totalCheckins, firstCheckinAt, weeklyDrain, weeklyBurnout, periods } =
        await getInsights()
      set({
        status: 'succeeded',
        insights,
        totalCheckins: totalCheckins ?? null,
        firstCheckinAt: firstCheckinAt ?? null,
        weeklyDrain: weeklyDrain ?? null,
        weeklyBurnout: weeklyBurnout ?? null,
        periods: periods ?? null,
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
        insights:
          Array.isArray(result.insights) && (result.insights.length > 0 || !result.fallback)
            ? result.insights
            : state.insights,
        lastInsight: result.lastInsight ?? state.lastInsight,
        totalCheckins: result.totalCheckins ?? state.totalCheckins,
        firstCheckinAt: result.firstCheckinAt ?? state.firstCheckinAt,
        weeklyDrain: result.weeklyDrain ?? state.weeklyDrain,
        weeklyBurnout: result.weeklyBurnout ?? state.weeklyBurnout,
        periods: result.periods ?? state.periods,
        notice: fallbackMessage,
      }))
      if (fallbackMessage) {
        useToastStore.getState().error(fallbackMessage)
      } else {
        useToastStore.getState().success('Reflection complete. Your patterns & boundaries are up to date.')
      }
    } catch (err) {
      set({ status: 'failed', error: err.message })
    }
  },
}))
