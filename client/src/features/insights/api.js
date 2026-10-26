// Public API of the insights feature — the ONLY import path other
// features may use.
import { request } from '../../lib/api/request.js'

export function getInsights() {
  return request('/insights')
}

export function analyzeInsights() {
  return request('/insights/analyze', { method: 'POST' })
}
