// Orchestrates the deterministic engine: loads the user's recent check-ins
// through the existing repository (ownership scoping preserved) and runs
// both rule sets. Returns { signals } — always an array, never null.
// No AI, no persistence, no external calls.
import { listCheckins } from '../../modules/checkins/checkins.repository.js'
import { detectBoundarySignals } from './boundary.rules.js'
import { detectBurnoutSignals, thresholds } from './burnout.rules.js'

export async function analyzeUserPatterns(userId) {
  // Fetch generously; rules apply the window themselves.
  const rows = await listCheckins(userId, { limit: 100, offset: 0 })
  const { windowDays, minCheckins } = thresholds()
  return {
    windowDays,
    minCheckins,
    checkinsConsidered: rows.length,
    signals: [
      ...detectBurnoutSignals(rows, { windowDays, minCheckins }),
      ...detectBoundarySignals(rows, { windowDays, minCheckins }),
    ],
  }
}
