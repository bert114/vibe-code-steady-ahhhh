// Public API of the users feature — the ONLY import path other
// features may use.
import { request } from '../../lib/api/request.js'

export function deleteMyAccount() {
  return request('/users/me', { method: 'DELETE' })
}

export function exportMyData() {
  return request('/users/export')
}

