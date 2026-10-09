import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import './AppShell.css'
import ToastStack from '../components/ui/Toast.jsx'
import QuickCheckInDialog from '../features/checkins/components/QuickCheckInDialog.jsx'

const LINKS = [
  { to: '/', label: 'Home', icon: 'grid' },
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/check-in', label: 'Daily Reflection', icon: 'checkin' },
  { to: '/check-in#history-heading', label: 'Reflection History', icon: 'trend' },
  { to: '/insights', label: 'Personal Insights', icon: 'spark' },
  { to: '/settings', label: 'Profile & Settings', icon: 'settings' },
]
const SIDEBAR_PREFERENCE_KEY = 'steady-ahh:workspace-sidebar-collapsed'

function readSidebarPreference() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === 'true'
  } catch {
    return false
  }
}

function NavIcon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    checkin: <><path d="M12 3.5v17" /><path d="M3.5 12h17" /><circle cx="12" cy="12" r="9" /></>,
    trend: <><path d="M4 18.5 9 13l3.5 3L20 8" /><path d="M15.5 8H20v4.5" /></>,
    spark: <><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></>,
  }

  return <svg aria-hidden="true" viewBox="0 0 24 24" {...common}>{paths[name]}</svg>
}

function BrandMark() {
  return <span className="workspace-brand__mark" aria-hidden="true"><span /></span>
}

function SidebarLinks({ onNavigate, id }) {
  const location = useLocation()
  const historySectionActive = location.pathname === '/check-in'
    && location.hash === '#history-heading'

  return (
    <nav id={id} aria-label="Workspace" className="workspace-sidebar__nav">
      <p className="workspace-sidebar__label">Your space</p>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/' || link.to === '/check-in'}
          onClick={onNavigate}
          aria-label={link.label}
          data-tooltip={link.label}
          className={({ isActive }) => {
            const isHistoryLink = link.to === '/check-in#history-heading'
            const active = isHistoryLink
              ? historySectionActive
              : link.to === '/check-in'
                ? isActive && !historySectionActive
                : isActive
            return `workspace-nav__link${active ? ' is-active' : ''}`
          }}
        >
          <NavIcon name={link.icon} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function ProfilePlaceholder({ id, onNavigate }) {
  const [open, setOpen] = useState(false)
  const profileRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className="workspace-profile" ref={profileRef}>
      <button
        ref={triggerRef}
        type="button"
        className="workspace-profile__trigger"
        aria-label="Profile options"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="workspace-profile__avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.6-3.3 2.8-5 6.5-5s5.9 1.7 6.5 5" /></svg>
        </span>
        <span className="workspace-profile__label">Profile</span>
        <svg className="workspace-profile__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      </button>
      <div className="workspace-profile__menu" id={id} hidden={!open}>
        <p>Profile setup is coming later.</p>
        <Link
          to="/settings"
          onClick={() => {
            setOpen(false)
            onNavigate?.()
          }}
        >
          Open settings
        </Link>
      </div>
    </div>
  )
}

function SidebarFooter({ menuId, onNavigate }) {
  return (
    <div className="workspace-sidebar__footer">
      <div className="workspace-sidebar__note">
        <span className="workspace-sidebar__note-mark" aria-hidden="true" />
        <p>A little space to notice what you need.</p>
      </div>
      <div className="workspace-sidebar__account">
        <p className="workspace-sidebar__account-label">Your account</p>
        <ProfilePlaceholder id={menuId} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

export default function AppShell({ children, variant = 'app' }) {
  const [quickCheckInOpen, setQuickCheckInOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarPreference)
  const drawerRef = useRef(null)
  const menuToggleRef = useRef(null)
  const wasDrawerOpen = useRef(false)
  const location = useLocation()
  const currentPage = variant === 'landing'
    ? 'Home'
    : location.pathname === '/check-in' && location.hash === '#history-heading'
      ? 'Reflection History'
      : LINKS.find((link) => link.to === location.pathname)?.label ?? 'Your space'

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(sidebarCollapsed))
    } catch {
      // The shell remains usable when the browser blocks local storage.
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
        return
      }
      if (event.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll('a[href], button:not(:disabled)')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!drawerRef.current?.contains(document.activeElement)) {
          event.preventDefault()
          first.focus()
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  useLayoutEffect(() => {
    if (drawerOpen) {
      wasDrawerOpen.current = true
      drawerRef.current?.querySelector('.workspace-drawer__close')?.focus()
    } else if (wasDrawerOpen.current) {
      wasDrawerOpen.current = false
      menuToggleRef.current?.focus()
    }
  }, [drawerOpen])

  function openMobileDrawer() {
    setDrawerOpen(true)
    window.setTimeout(() => {
      drawerRef.current?.querySelector('.workspace-drawer__close')?.focus()
    }, 0)
  }

  if (variant === 'landing') {
    return (
      <div className={`app-shell app-shell--workspace app-shell--landing${sidebarCollapsed ? ' is-collapsed' : ''}`}>
        <aside className="workspace-sidebar workspace-sidebar--landing" aria-label="Main sidebar">
          <div className="workspace-sidebar__head">
            <Link to="/" className="workspace-brand" aria-label="Steady-Ahh home">
              <BrandMark />
              <span>Steady-Ahh</span>
            </Link>
            <button
              type="button"
              className="workspace-sidebar__toggle"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!sidebarCollapsed}
              aria-controls="workspace-desktop-navigation"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M9 4.5v15M14.5 9.5 12 12l2.5 2.5" /></svg>
            </button>
          </div>
          <SidebarLinks id="workspace-desktop-navigation" />
          <SidebarFooter menuId="workspace-profile-menu-landing-desktop" />
        </aside>

        {drawerOpen && <button type="button" className="workspace-drawer-backdrop" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}

        <div className="workspace-main">
          <header className="workspace-topbar workspace-topbar--landing">
            <div className="workspace-topbar__leading">
              <button ref={menuToggleRef} type="button" className="workspace-menu-toggle" aria-label="Open navigation" aria-expanded={drawerOpen} aria-controls="workspace-mobile-navigation" onClick={openMobileDrawer}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              </button>
              <span className="workspace-topbar__page">Home</span>
            </div>
          </header>
          <div className="workspace-content">{children}</div>
        </div>

        <div ref={drawerRef} id="workspace-mobile-navigation" className={`workspace-drawer workspace-drawer--landing${drawerOpen ? ' is-open' : ''}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
          <div className="workspace-drawer__head">
            <Link to="/" className="workspace-brand" onClick={() => setDrawerOpen(false)}><BrandMark /><span>Steady-Ahh</span></Link>
            <button type="button" className="workspace-drawer__close" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <SidebarLinks onNavigate={() => setDrawerOpen(false)} />
          <SidebarFooter menuId="workspace-profile-menu-landing-mobile" onNavigate={() => setDrawerOpen(false)} />
        </div>
        <ToastStack />
      </div>
    )
  }

  return (
    <div className={`app-shell app-shell--workspace${sidebarCollapsed ? ' is-collapsed' : ''}${location.pathname === '/check-in' ? ' is-checkin' : ''}`}>
      <aside className="workspace-sidebar" aria-label="Main sidebar">
        <div className="workspace-sidebar__head">
          <Link to="/dashboard" className="workspace-brand" aria-label="Steady-Ahh dashboard">
            <BrandMark />
            <span>Steady-Ahh</span>
          </Link>
          <button
            type="button"
            className="workspace-sidebar__toggle"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="workspace-desktop-navigation"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M9 4.5v15M14.5 9.5 12 12l2.5 2.5" /></svg>
          </button>
        </div>
        <SidebarLinks id="workspace-desktop-navigation" />
        <SidebarFooter menuId="workspace-profile-menu-workspace-desktop" />
      </aside>

      {drawerOpen && <button type="button" className="workspace-drawer-backdrop" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar__leading">
            <button ref={menuToggleRef} type="button" className="workspace-menu-toggle" aria-label="Open navigation" aria-expanded={drawerOpen} aria-controls="workspace-mobile-navigation" onClick={openMobileDrawer}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <span className="workspace-topbar__page">{currentPage}</span>
          </div>
          <div className="workspace-topbar__actions">
            <button type="button" className="workspace-quick-action" aria-label="Quick check-in" onClick={() => setQuickCheckInOpen(true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              <span>Quick check-in</span>
            </button>
          </div>
        </header>

        <div ref={drawerRef} id="workspace-mobile-navigation" className={`workspace-drawer${drawerOpen ? ' is-open' : ''}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
          <div className="workspace-drawer__head">
            <Link to="/dashboard" className="workspace-brand" onClick={() => setDrawerOpen(false)}><BrandMark /><span>Steady-Ahh</span></Link>
            <button type="button" className="workspace-drawer__close" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <SidebarLinks onNavigate={() => setDrawerOpen(false)} />
          <SidebarFooter menuId="workspace-profile-menu-workspace-mobile" onNavigate={() => setDrawerOpen(false)} />
        </div>

        <div className="workspace-content">{children}</div>
      </div>
      <QuickCheckInDialog open={quickCheckInOpen} onClose={() => setQuickCheckInOpen(false)} />
      <ToastStack />
    </div>
  )
}
