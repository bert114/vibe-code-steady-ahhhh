import { create } from 'zustand'

// App-wide toast notifications: success confirmations and API error
// responses (including validation details). Any layer may push — the
// shared request helper pushes errors automatically, feature stores push
// successes with contextual copy. No React imports: safe for non-component
// callers. Timers live here so dismissal works without a mounted hook.
const MAX_TOASTS = 3
const TOAST_TTL_MS = 5000
const MAX_DETAILS = 3

const timers = new Map()
let nextId = 1

function normalizeDetail(detail) {
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object') {
    const path = Array.isArray(detail.path) ? detail.path.join('.') : detail.path
    if (detail.message && path) return `${path}: ${detail.message}`
    return detail.message ?? (path ? String(path) : null)
  }
  return null
}

export function normalizeDetails(details) {
  if (!Array.isArray(details)) return []
  return details.map(normalizeDetail).filter(Boolean)
}

function scheduleDismiss(id) {
  if (timers.has(id)) clearTimeout(timers.get(id))
  timers.set(
    id,
    setTimeout(() => {
      useToastStore.getState().dismiss(id)
    }, TOAST_TTL_MS),
  )
}

export const useToastStore = create((set, get) => ({
  toasts: [],

  push: ({ kind = 'success', message, details = [] } = {}) => {
    const id = nextId++
    const normalized = normalizeDetails(details).slice(0, MAX_DETAILS)
    const hiddenCount = Math.max(0, normalizeDetails(details).length - MAX_DETAILS)
    const toast = { id, kind, message: String(message ?? ''), details: normalized, hiddenCount }
    const toasts = [...get().toasts, toast].slice(-MAX_TOASTS)
    // Cap the stack: drop the oldest (and clear its timer).
    if (get().toasts.length >= MAX_TOASTS) {
      const dropped = get().toasts[0]
      if (dropped && timers.has(dropped.id)) {
        clearTimeout(timers.get(dropped.id))
        timers.delete(dropped.id)
      }
    }
    set({ toasts })
    scheduleDismiss(id)
    return id
  },

  success: (message) => get().push({ kind: 'success', message }),

  error: (message, details) => get().push({ kind: 'error', message, details }),

  dismiss: (id) => {
    if (timers.has(id)) {
      clearTimeout(timers.get(id))
      timers.delete(id)
    }
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },

  clear: () => {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    set({ toasts: [] })
  },
}))

export const TOAST_TTL_MS_VALUE = TOAST_TTL_MS
export const TOAST_MAX_DETAILS = MAX_DETAILS
