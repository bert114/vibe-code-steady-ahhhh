// Cross-module read model for the Insights screen: stored insights plus the
// user's all-time check-in count and rolling weekly drain average. Composes
// existing module services — no SQL, no user-facing copy.
import { analyzeRecentCheckins, getLatestInsights } from "../../services/ai/ai.service.js";
import { invalidateUserCache, readThrough } from "../../services/cache/cache.service.js";
import { summarizeWeeklyBurnout } from "../../services/patterns/burnout.rules.js";
import { analyzeUserPatterns } from "../../services/patterns/pattern.service.js";
import { getCheckinStats, getWeeklyDrain, getWindowSummary } from "../checkins/checkins.service.js";

function weeklyBurnoutFor(patterns, weeklyDrain) {
  return summarizeWeeklyBurnout(patterns.signals, {
    checkins: weeklyDrain?.checkins ?? 0,
    minCheckins: patterns.minCheckins,
    windowDays: patterns.windowDays,
  });
}

export function getInsightsOverview(userId) {
  return readThrough(userId, "insights:overview", () => buildInsightsOverview(userId));
}

async function buildInsightsOverview(userId) {
  const [insights, stats, weeklyDrain, patterns, week, month] = await Promise.all([
    getLatestInsights(userId),
    getCheckinStats(userId),
    getWeeklyDrain(userId),
    analyzeUserPatterns(userId),
    getWindowSummary(userId, 7),
    getWindowSummary(userId, 30),
  ]);
  return {
    insights,
    ...stats,
    weeklyDrain,
    weeklyBurnout: weeklyBurnoutFor(patterns, weeklyDrain),
    periods: { week, month },
  };
}

export async function analyzeInsights(userId) {
  const [result, stats, weeklyDrain, patterns, week, month] = await Promise.all([
    analyzeRecentCheckins(userId),
    getCheckinStats(userId),
    getWeeklyDrain(userId),
    analyzeUserPatterns(userId),
    getWindowSummary(userId, 7),
    getWindowSummary(userId, 30),
  ]);
  // Analysis may store new insights + reminders: stale every cached read model.
  await invalidateUserCache(userId);
  return {
    ...result,
    ...stats,
    weeklyDrain,
    weeklyBurnout: weeklyBurnoutFor(patterns, weeklyDrain),
    periods: { week, month },
  };
}
