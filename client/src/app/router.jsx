import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import SignInPage from '../features/auth/pages/SignInPage.jsx'
import SignUpPage from '../features/auth/pages/SignUpPage.jsx'
import CheckInPage from '../features/checkins/pages/CheckInPage.jsx'
import InsightsPage from '../features/insights/pages/InsightsPage.jsx'
import DashboardPage from '../features/reminders/pages/DashboardPage.jsx'
import SettingsPage from '../features/users/pages/SettingsPage.jsx'
import AppShell from './AppShell.jsx'
import { AuthProvider, RequireAuth, clerkEnabled } from './auth.jsx'

function Placeholder({ title, hint }) {
  return (
    <main>
      <h1>{title}</h1>
      {hint ? <p>{hint}</p> : null}
      <p>
        <Link to="/dashboard">Go to your dashboard</Link>
      </p>
    </main>
  )
}

// Every page gets the same nav shell so no screen is a dead end; protected
// pages additionally require a signed-in user.
function Shell({ children, needsAuth }) {
  const content = <AppShell>{children}</AppShell>
  return needsAuth ? <RequireAuth>{content}</RequireAuth> : content
}

// Auth modes: with VITE_CLERK_PUBLISHABLE_KEY set, Clerk signs users in and
// RequireAuth gates the feature routes. Without it (local dev), the server
// dev bypass resolves the user and gates pass through.
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <Shell>
                <Placeholder
                  title="Steady-Ahh"
                  hint="A calm space to check in with yourself."
                />
              </Shell>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Shell needsAuth>
                <DashboardPage />
              </Shell>
            }
          />
          <Route
            path="/check-in"
            element={
              <Shell needsAuth>
                <CheckInPage />
              </Shell>
            }
          />
          <Route
            path="/insights"
            element={
              <Shell needsAuth>
                <InsightsPage />
              </Shell>
            }
          />
          <Route
            path="/settings"
            element={
              <Shell needsAuth>
                <SettingsPage />
              </Shell>
            }
          />
          {clerkEnabled && (
            <>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
            </>
          )}
          <Route
            path="*"
            element={
              <Shell>
                <Placeholder title="Not found" />
              </Shell>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
