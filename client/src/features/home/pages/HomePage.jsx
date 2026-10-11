import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthGatedLink from '../../../app/AuthGatedLink.jsx'
import landingReference from '../../../assets/landing-reference.png'
import privacyIllustration from '../../../assets/privacy-illustration-c.png'
import './HomePage.css'

const layoutStorageKey = 'steady-ahh-privacy-card-layout'
const defaultLayout = { order: ['image', 'privacy'], sizes: {} }
const layoutCardIds = new Set(['image', 'privacy'])

function hasLayoutEditQuery() {
  return typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('edit') === 'layout'
}

function loadLayout() {
  if (typeof window === 'undefined') return defaultLayout

  try {
    const saved = JSON.parse(window.localStorage.getItem(layoutStorageKey) || 'null')
    if (!saved || typeof saved !== 'object') return defaultLayout

    const orderIsValid = Array.isArray(saved.order)
      && saved.order.length === 2
      && new Set(saved.order).size === 2
      && saved.order.every((cardId) => layoutCardIds.has(cardId))
    const sizes = {}

    for (const cardId of layoutCardIds) {
      const size = saved.sizes?.[cardId]
      if (
        Number.isFinite(size?.width)
        && Number.isFinite(size?.height)
        && size.width >= 220
        && size.height >= 220
      ) {
        sizes[cardId] = { width: size.width, height: size.height }
      }
    }

    return { order: orderIsValid ? saved.order : defaultLayout.order, sizes }
  } catch {
    return defaultLayout
  }
}

function persistLayout(layout) {
  try {
    window.localStorage.setItem(layoutStorageKey, JSON.stringify(layout))
  } catch {
    // Keep editing available if browser storage is unavailable or full.
  }
}

export default function HomePage() {
  const [layout, setLayout] = useState(loadLayout)
  const [isEditing, setIsEditing] = useState(hasLayoutEditQuery)
  const [draggedCard, setDraggedCard] = useState(null)
  const editorAvailable = hasLayoutEditQuery()

  const saveLayout = (nextLayout) => {
    setLayout(nextLayout)
    persistLayout(nextLayout)
  }

  const handleDragStart = (cardId, event) => {
    if (!isEditing) return
    setDraggedCard(cardId)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', cardId)
    }
  }

  const handleDrop = (targetCardId, event) => {
    event.preventDefault()
    const sourceCardId = event.dataTransfer?.getData('text/plain') || draggedCard
    setDraggedCard(null)
    if (!isEditing || !sourceCardId || sourceCardId === targetCardId) return

    const nextOrder = [...layout.order]
    const sourceIndex = nextOrder.indexOf(sourceCardId)
    const targetIndex = nextOrder.indexOf(targetCardId)
    if (sourceIndex === -1 || targetIndex === -1) return
    ;[nextOrder[sourceIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[sourceIndex]]
    saveLayout({ ...layout, order: nextOrder })
  }

  const saveResizedSize = (cardId, event) => {
    if (!isEditing || event.target !== event.currentTarget) return
    const { width, height } = event.currentTarget.getBoundingClientRect()
    const size = { width: Math.round(width), height: Math.round(height) }
    if (size.width < 220 || size.height < 220) return

    const previous = layout.sizes[cardId]
    if (previous && previous.width === size.width && previous.height === size.height) return
    saveLayout({ ...layout, sizes: { ...layout.sizes, [cardId]: size } })
  }

  const cardStyle = (cardId) => ({
    order: layout.order.indexOf(cardId),
    width: layout.sizes[cardId] ? `${layout.sizes[cardId].width}px` : undefined,
    height: layout.sizes[cardId] ? `${layout.sizes[cardId].height}px` : undefined,
  })

  const resetLayout = () => {
    try {
      window.localStorage.removeItem(layoutStorageKey)
    } catch {
      // Reset the in-memory layout even if browser storage is unavailable.
    }
    setLayout(defaultLayout)
  }

  return (
    <main className="landing-page landing-page--calm">
      <section className="calm-hero" aria-labelledby="landing-title">
        <div className="calm-hero__copy">
          <p className="calm-hero__eyebrow">A calmer way to check in</p>
          <h1 id="landing-title">Make room for what you need.</h1>
          <p className="calm-hero__subtitle">
            One small check-in. A little more clarity.
          </p>
          <AuthGatedLink to="/check-in" className="calm-hero__cta">
            Start a check-in
          </AuthGatedLink>
        </div>
        <div className="calm-hero__visual">
          <img
            src={landingReference}
            alt="Three calm mobile app screens showing a simple dashboard, an insight, and a discovery view"
          />
        </div>
      </section>

      <section className="privacy-assurance" aria-labelledby="privacy-assurance-title">
        {editorAvailable && (
          <div className="privacy-assurance__editor-toolbar" aria-label="Privacy card layout editor">
            <p>
              {isEditing
                ? 'Drag a grip onto the other card to swap sides. Resize from a card’s lower-right corner. Changes save in this browser.'
                : 'Your privacy-card layout is saved in this browser.'}
            </p>
            <div className="privacy-assurance__editor-actions">
              <button type="button" onClick={() => setIsEditing((current) => !current)}>
                {isEditing ? 'Done editing' : 'Edit layout'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetLayout}>
                  Reset layout
                </button>
              )}
            </div>
          </div>
        )}

        <div className="privacy-assurance__intro-row" data-testid="privacy-intro-row">
          <div className="privacy-assurance__copy">
            <p className="privacy-assurance__eyebrow">Your space, your choices</p>
            <h2 id="privacy-assurance-title">Your reflections belong only to you</h2>
          </div>
          <p className="privacy-assurance__note">
            Your reflections stay yours. You can view your timeline, export your data, or erase
            your history whenever you choose.
          </p>
        </div>

        <div className="privacy-assurance__panel" data-testid="privacy-card-panel">
          <div
            className={`privacy-assurance__visual${isEditing ? ' privacy-assurance__card--editing' : ''}${draggedCard === 'image' ? ' is-dragging' : ''}`}
            data-testid="privacy-card-image"
            data-layout-card="image"
            style={cardStyle('image')}
            onDragOver={(event) => isEditing && event.preventDefault()}
            onDrop={(event) => handleDrop('image', event)}
            onPointerUp={(event) => saveResizedSize('image', event)}
          >
            {isEditing && (
              <button
                type="button"
                className="privacy-assurance__card-drag-handle"
                draggable="true"
                aria-label="Drag image card to reorder"
                onDragStart={(event) => handleDragStart('image', event)}
                onDragEnd={() => setDraggedCard(null)}
              >
                ⠿ Drag
              </button>
            )}
            <img
              src={privacyIllustration}
              alt="A cream reflection journal wrapped with an apricot ribbon inside a gentle open boundary"
            />
          </div>

          <div
            className={`privacy-assurance__content${isEditing ? ' privacy-assurance__card--editing' : ''}${draggedCard === 'privacy' ? ' is-dragging' : ''}`}
            data-testid="privacy-card-proof"
            data-layout-card="privacy"
            style={cardStyle('privacy')}
            onDragOver={(event) => isEditing && event.preventDefault()}
            onDrop={(event) => handleDrop('privacy', event)}
            onPointerUp={(event) => saveResizedSize('privacy', event)}
          >
            {isEditing && (
              <button
                type="button"
                className="privacy-assurance__card-drag-handle"
                draggable="true"
                aria-label="Drag privacy card to reorder"
                onDragStart={(event) => handleDragStart('privacy', event)}
                onDragEnd={() => setDraggedCard(null)}
              >
                ⠿ Drag
              </button>
            )}
            <ul className="privacy-assurance__promises" aria-label="Your choices">
              <li>
                <span className="privacy-assurance__mark" aria-hidden="true">↗</span>
                <span className="privacy-assurance__promise-copy">
                  <strong>Export anytime</strong>
                  <span>Take a copy of your reflections with you.</span>
                </span>
              </li>
              <li>
                <span className="privacy-assurance__mark" aria-hidden="true">×</span>
                <span className="privacy-assurance__promise-copy">
                  <strong>Erase anytime</strong>
                  <span>Delete your account and its history when you choose.</span>
                </span>
              </li>
            </ul>

            <Link to="/settings" className="privacy-assurance__link">
              Review privacy &amp; settings <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
