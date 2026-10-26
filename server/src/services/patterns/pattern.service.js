// Orchestrates the deterministic engine: loads the user's recent check-ins
// through the existing repository (ownership scoping preserved) and runs
// both rule sets. Returns { signals } — always an array, never null.
// No AI, no persistence, no external calls.
import { listCheckins } from '../../modules/checkins/checkins.repository.js'
import { detectBoundarySignals } from './boundary.rules.js'
import { detectBurnoutSignals } from './burnout.rules.js'

function analysisWindowDays() {
  return Number(process.env.BURNOUT_SIGNAL_WINDOW_DAYS ?? 7)
}

export async function analyzeUserPatterns(userId) {
  // Fetch generously; rules apply the window themselves.
  const rows = await listCheckins(userId, { limit: 100, offset: 0 })
  const windowDays = analysisWindowDays()
  return {
    windowDays,
    checkinsConsidered: rows.length,
    signals: [
      ...detectBurnoutSignals(rows, { windowDays }),
      ...detectBoundarySignals(rows, { windowDays }),
    ],
  }
}
