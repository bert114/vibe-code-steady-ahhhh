import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInsightsStore } from '../store.js'

import './InsightsPage.css'

function IconClock({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

function IconSparkle({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 4c.55 3.1 1.4 3.95 4.5 4.5-3.1.55-3.95 1.4-4.5 4.5-.55-3.1-1.4-3.95-4.5-4.5C9.6 7.95 10.45 7.1 11 4Z" />
      <path d="M17.5 14.5c.3 1.7.8 2.2 2.5 2.5-1.7.3-2.2.8-2.5 2.5-.3-1.7-.8-2.2-2.5-2.5 1.7-.3 2.2-.8 2.5-2.5Z" />
    </svg>
  )
}

function IconArrow({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13" />
      <path d="M12.5 6.5 19 12l-6.5 5.5" />
    </svg>
  )
}

function IconInfo({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16.5v-5" />
      <path d="M12 8.2h.01" />
    </svg>
  )
}

function IconWaves({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0 2.7-1.6 4 0 2.7 1.6 4 0" />
      <path d="M3 12c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0 2.7-1.6 4 0 2.7 1.6 4 0" />
      <path d="M3 16.5c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0 2.7-1.6 4 0 2.7 1.6 4 0" />
    </svg>
  )
}

function IconHeart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  )
}

function IconEye({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-6.8 10-6.8S22 12 22 12s-3.6 6.8-10 6.8S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function TypeLabel(type) {
  const labels = {
    pattern: 'Pattern',
    burnout: 'Burnout Signal',
    boundary: 'Boundary Awareness',
    general: 'General Trend',
  }
  return labels[type] || labels.general
}

function BetaBanner({ status, notice }) {
  const analyzing = status === 'analyzing'
  const state = analyzing ? 'analyzing' : notice ? 'notice' : 'default'

  return (
    <div className="insights-banner" role="status" aria-live="polite" data-state={state}>
      <span className="insights-banner__icon" aria-hidden="true">
        {analyzing ? <span className="insights-banner__pulse" /> : <IconInfo />}
      </span>
      <div className="insights-banner__body">
        <strong>{analyzing ? 'Analysis in progress' : 'Insights are in beta'}</strong>
        <span>
          {analyzing
            ? 'Analyzing your recent check-ins…'
            : notice ||
              "Analysis may be temporarily unavailable. We'll only show observations grounded in your check-ins."}
