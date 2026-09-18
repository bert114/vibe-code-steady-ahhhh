// Public API of the reminders feature — the ONLY import path other
// features may use.
import { request } from '../../lib/api/request.js'

export function getSignals() {
  return request('/insights/signals')
}
