import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthGatedLink from '../../../app/AuthGatedLink.jsx'
import landingReference from '../../../assets/landing-reference.png'
import privacyIllustration from '../../../assets/privacy-illustration-editorial.jpg'
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
        <div className="calm-hero__copy calm-hero__copy--trust">
          <p className="calm-hero__eyebrow">A private space to reflect</p>
          <h1 id="landing-title">Understand what you’re feeling.</h1>
          <p className="calm-hero__subtitle">Name the moment, notice what repeats, and stay in control of your reflections.</p>
          <AuthGatedLink to="/check-in" className="calm-hero__cta">Begin a reflection</AuthGatedLink>
        </div>
        <div className="calm-hero__visual">
          <img
            src={landingReference}
            alt="Three calm mobile app screens showing a wellbeing overview, a pattern reflection, and a discovery view"
          />
        </div>
      </section>

      <section className="privacy-assurance privacy-assurance--narrow-tight" aria-labelledby="privacy-assurance-title">
        {editorAvailable && (
          <div className="privacy-assurance__editor-toolbar" aria-label="Privacy card layout editor">
            <p>{isEditing ? "Drag a grip onto the other card to swap sides. Resize from a card’s lower-right corner. Changes save in this browser." : "Your privacy-card layout is saved in this browser."}</p>
            <div className="privacy-assurance__editor-actions"><button type="button" onClick={() => setIsEditing((current) => !current)}>{isEditing ? "Done editing" : "Edit layout"}</button>{isEditing && <button type="button" onClick={resetLayout}>Reset layout</button>}</div>
          </div>
        )}
        <div className="privacy-assurance__intro-row" data-testid="privacy-intro-row"><div className="privacy-assurance__copy"><p className="privacy-assurance__eyebrow">A clearer way to reflect</p><h2 id="privacy-assurance-title">What Steady-Ahh helps you do</h2></div><p className="privacy-assurance__note">Record what happened, notice what repeats, and decide what to do with your reflections.</p></div>
        <div className="privacy-assurance__panel" data-testid="privacy-card-panel">
          <div className={"privacy-assurance__visual" + (isEditing ? " privacy-assurance__card--editing" : "") + (draggedCard === "image" ? " is-dragging" : "")} data-testid="privacy-card-image" data-layout-card="image" style={cardStyle("image")} onDragOver={(event) => isEditing && event.preventDefault()} onDrop={(event) => handleDrop("image", event)} onPointerUp={(event) => saveResizedSize("image", event)}>{isEditing && <button type="button" className="privacy-assurance__card-drag-handle" draggable="true" aria-label="Drag image card to reorder" onDragStart={(event) => handleDragStart("image", event)} onDragEnd={() => setDraggedCard(null)}>⠿ Drag</button>}<img src={privacyIllustration} alt="A cream reflection journal wrapped with an apricot ribbon inside a gentle open boundary" /></div>
          <div className={"privacy-assurance__content privacy-assurance__content--summary privacy-assurance__content--headed-top privacy-assurance__content--hierarchy-airy" + (isEditing ? " privacy-assurance__card--editing" : "") + (draggedCard === "privacy" ? " is-dragging" : "")} data-testid="privacy-card-proof" data-layout-card="privacy" style={cardStyle("privacy")} onDragOver={(event) => isEditing && event.preventDefault()} onDrop={(event) => handleDrop("privacy", event)} onPointerUp={(event) => saveResizedSize("privacy", event)}>{isEditing && <button type="button" className="privacy-assurance__card-drag-handle" draggable="true" aria-label="Drag privacy card to reorder" onDragStart={(event) => handleDragStart("privacy", event)} onDragEnd={() => setDraggedCard(null)}>⠿ Drag</button>}
            <div className="privacy-assurance__header-group">
              <h3 className="privacy-assurance__support-heading">Start with one moment.</h3>
              <p className="privacy-assurance__support-copy">A brief reflection is enough.</p>
            </div>
            <div data-impeccable-carbonize="e13b57f2" style={{ display: "contents" }}>
              {/* impeccable-carbonize-start e13b57f2 */}
              <style data-impeccable-css="e13b57f2">{`
              @scope ([data-impeccable-variant="1"]) {
              :scope > .privacy-assurance__capabilities-list--summary {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.9rem 1.25rem;
              margin: 0;
              padding: 0;
              list-style: none;
              }
              :scope > .privacy-assurance__capabilities-list--summary li {
              display: flex;
              align-items: center;
              gap: 0.65rem;
              padding: 0.45rem 0;
              border: 0;
              background: transparent;
              box-shadow: none;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__mark {
              width: 18px;
              height: 18px;
              border: 0;
              border-radius: 0;
              background: transparent;
              box-shadow: none;
              color: #5f5b55;
              opacity: var(--p-icon-opacity, 0.68);
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__mark svg {
              width: 16px;
              height: 16px;
              stroke: currentColor;
              stroke-width: 1.6;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__promise-copy strong {
              font-size: 0.92rem;
              font-weight: 500;
              letter-spacing: -0.01em;
              color: #46423d;
              }
              :scope[data-p-label-weight="regular"] > .privacy-assurance__capabilities-list--summary .privacy-assurance__promise-copy strong {
              font-weight: 400;
              color: #55504a;
              }
              }
              
              @scope ([data-impeccable-variant="2"]) {
              :scope > .privacy-assurance__capabilities-list--summary {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.85rem 1.15rem;
              margin: 0;
              padding: 0;
              list-style: none;
              }
              :scope[data-p-row-gap="compact"] > .privacy-assurance__capabilities-list--summary {
              gap: 0.5rem 1rem;
              }
              :scope > .privacy-assurance__capabilities-list--summary li {
              display: flex;
              align-items: center;
              gap: 0.65rem;
              padding: 0.4rem 0;
              border: 0;
              background: transparent;
              box-shadow: none;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__mark {
              width: 28px;
              height: 28px;
              border-radius: 8px;
              border: 1px solid rgba(81, 64, 46, var(--p-ring-border, 0.2));
              background: transparent;
              box-shadow: none;
              color: #5f5b55;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__mark svg {
              width: 14px;
              height: 14px;
              stroke: currentColor;
              stroke-width: 1.5;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__promise-copy strong {
              font-size: 0.91rem;
              font-weight: 500;
              color: #4a453f;
              }
              }
              
              @scope ([data-impeccable-variant="3"]) {
              :scope > .privacy-assurance__capabilities-list--summary {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.75rem 1.35rem;
              margin: 0;
              padding: 0;
              list-style: none;
              }
              :scope[data-p-columns="single-col"] > .privacy-assurance__capabilities-list--summary {
              grid-template-columns: 1fr;
              gap: 0.45rem;
              }
              :scope > .privacy-assurance__capabilities-list--summary li {
              display: flex;
              align-items: center;
              padding: 0.55rem 0 0;
              border: 0;
              border-top: 1px solid rgba(81, 64, 46, var(--p-rule-opacity, 0.12));
              background: transparent;
              box-shadow: none;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__mark {
              display: none;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__promise-copy strong {
              font-size: 0.91rem;
              font-weight: 500;
              letter-spacing: -0.01em;
              color: #4d4842;
              }
              }
              
              @scope ([data-impeccable-variant="4"]) {
              :scope > .privacy-assurance__capabilities-list--summary {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.8rem 1.25rem;
              margin: 0;
              padding: 0;
              list-style: none;
              }
              :scope > .privacy-assurance__capabilities-list--summary li {
              display: flex;
              align-items: center;
              gap: 0.6rem;
              padding: 0.35rem 0;
              border: 0;
              background: transparent;
              box-shadow: none;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__mark {
              width: 10px;
              height: 1.5px;
              border: 0;
              border-radius: 999px;
              background: #8a8279;
              box-shadow: none;
              color: transparent;
              font-size: 0;
              }
              :scope[data-p-marker-kind="dot"] > .privacy-assurance__capabilities-list--summary .privacy-assurance__mark {
              width: 5px;
              height: 5px;
              border-radius: 50%;
              }
              :scope > .privacy-assurance__capabilities-list--summary .privacy-assurance__promise-copy strong {
              font-size: 0.9rem;
              font-weight: 400;
              color: #57524c;
              }
              :scope[data-p-text-tone="deep-ink"] > .privacy-assurance__capabilities-list--summary .privacy-assurance__promise-copy strong {
              font-weight: 500;
              color: #383430;
              }
              }
              `}</style>
              {/* impeccable-param-values e13b57f2: {"ring-border":0.1,"row-gap":"balanced"} */}
              {/* impeccable-carbonize-end e13b57f2 */}
              <div data-impeccable-variant="2" style={{ display: 'contents' }}>
                <ul className="privacy-assurance__capabilities-list privacy-assurance__capabilities-list--summary" aria-label="What Steady-Ahh can help you do">
                  <li>
                    <span className="privacy-assurance__mark" aria-hidden="true">
                      <svg viewBox="0 0 16 16"><path d="M3.5 2.75h9a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1Z" /><path d="M5.5 6.25h5M5.5 9.25h3.25" /></svg>
                    </span>
                    <span className="privacy-assurance__promise-copy"><strong>Reflect daily</strong></span>
                  </li>
                  <li>
                    <span className="privacy-assurance__mark" aria-hidden="true">
                      <svg viewBox="0 0 16 16"><circle cx="5.25" cy="8" r="2.25" /><circle cx="10.75" cy="8" r="2.25" /></svg>
                    </span>
                    <span className="privacy-assurance__promise-copy"><strong>Notice patterns</strong></span>
                  </li>
                  <li>
                    <span className="privacy-assurance__mark" aria-hidden="true">
                      <svg viewBox="0 0 16 16"><path d="M8 2.5v11M4.25 5.25a4.5 4.5 0 0 0 0 5.5M11.75 5.25a4.5 4.5 0 0 1 0 5.5" /></svg>
                    </span>
                    <span className="privacy-assurance__promise-copy"><strong>Reflect on boundaries</strong></span>
                  </li>
                  <li>
                    <span className="privacy-assurance__mark" aria-hidden="true">
                      <svg viewBox="0 0 16 16"><path d="M3 5.25h10M3 10.75h10" /><circle cx="6" cy="5.25" r="1.5" /><circle cx="10" cy="10.75" r="1.5" /></svg>
                    </span>
                    <span className="privacy-assurance__promise-copy"><strong>Control your data</strong></span>
                  </li>
                </ul>
              </div>
            </div>
            <Link to="/settings" className="privacy-assurance__link">Review privacy &amp; settings <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  )
}
