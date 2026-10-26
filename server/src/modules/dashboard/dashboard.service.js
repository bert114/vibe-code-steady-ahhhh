// Cross-module read model: composes existing module services (never SQL,
// never user-facing copy). One payload for the Dashboard summary screen.
import { getLatestInsights } from '../../services/ai/ai.service.js'
import { analyzeUserPatterns } from '../../services/patterns/pattern.service.js'
import { getCheckins } from '../checkins/checkins.service.js'
import { countUnreadReminders, getReminders } from '../reminders/reminders.service.js'

export async function getDashboardSummary(userId) {
  const [recentCheckins, insights, patterns, reminders, unreadReminders] = await Promise.all([
    getCheckins(userId, { limit: 5, offset: 0 }),
    getLatestInsights(userId),
    analyzeUserPatterns(userId),
    getReminders(userId, { limit: 10, offset: 0 }),
    countUnreadReminders(userId),
  ])
  return {
    recentCheckins,
    latestInsight: insights[0] ?? null,
    signals: patterns.signals,
    signalsMeta: {
      windowDays: patterns.windowDays,
      checkinsConsidered: patterns.checkinsConsidered,
    },
    reminders,
    unreadReminders,
  }
}
