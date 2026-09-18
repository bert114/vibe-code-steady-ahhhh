// Public API of the checkins feature — the ONLY import path other
// features may use. Never import this feature's private files directly.
import { request } from '../../lib/api/request.js'

export function createCheckin(data) {
  return request('/check-ins', { method: 'POST', body: data })
}

export function listCheckins({ limit = 30, offset = 0 } = {}) {
  return request(`/check-ins?limit=${limit}&offset=${offset}`)
}

export function getCheckin(id) {
  return request(`/check-ins/${id}`)
}
