// Cross-module read model for the Insights screen: stored insights plus the
// user's all-time check-in count and rolling weekly drain average. Composes
// existing module services — no SQL, no user-facing copy.
import { analyzeRecentCheckins, getLatestInsights } from "../../services/ai/ai.service.js";
import { summarizeWeeklyBurnout } from "../../services/patterns/burnout.rules.js";
import { analyzeUserPatterns } from "../../services/patterns/pattern.service.js";
import { getCheckinStats, getWeeklyDrain } from "../checkins/checkins.service.js";

function weeklyBurnoutFor(patterns, weeklyDrain) {
  return summarizeWeeklyBurnout(patterns.signals, {
    checkins: weeklyDrain?.checkins ?? 0,
    minCheckins: patterns.minCheckins,
    windowDays: patterns.windowDays,
  });
}

export async function getInsightsOverview(userId) {
  const [insights, stats, weeklyDrain, patterns] = await Promise.all([
    getLatestInsights(userId),
    getCheckinStats(userId),
    getWeeklyDrain(userId),
    analyzeUserPatterns(userId),
  ]);
  return {
    insights,
    ...stats,
    weeklyDrain,
    weeklyBurnout: weeklyBurnoutFor(patterns, weeklyDrain),
  };
}

export async function analyzeInsights(userId) {
  const [result, stats, weeklyDrain, patterns] = await Promise.all([
    analyzeRecentCheckins(userId),
    getCheckinStats(userId),
    getWeeklyDrain(userId),
    analyzeUserPatterns(userId),
  ]);
  return {
    ...result,
    ...stats,
    weeklyDrain,
    weeklyBurnout: weeklyBurnoutFor(patterns, weeklyDrain),
  };
}
