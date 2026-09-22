import { useEffect, useRef } from 'react'

// Gentle scroll entry: translateY(12px) + opacity over 600ms.
// Uses IntersectionObserver only, transform/opacity only.
export function useReveal(deps = []) {
  const scopeRef = useRef(null)

  useEffect(() => {
    const root = scopeRef.current
    if (!root) return undefined
    const items = root.querySelectorAll('.reveal')
    if (items.length === 0) return undefined
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      items.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }
    if (typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scopeRef
}
