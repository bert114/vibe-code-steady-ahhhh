import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import SignInPage from '../features/auth/pages/SignInPage.jsx'
import SignUpPage from '../features/auth/pages/SignUpPage.jsx'
import ReflectionPage from '../features/checkins/pages/ReflectionPage.jsx'
import HomePage from '../features/home/pages/HomePage.jsx'
import PatternsAndBoundariesPage from '../features/insights/pages/PatternsAndBoundariesPage.jsx'
import WellbeingOverviewPage from '../features/reminders/pages/WellbeingOverviewPage.jsx'
import EnergyOverTimePage from '../features/trends/pages/EnergyOverTimePage.jsx'
import PrivacyAndSettingsPage from '../features/users/pages/PrivacyAndSettingsPage.jsx'
import AppShell from './AppShell.jsx'
import { AuthProvider, RequireAuth } from './auth.jsx'

function Placeholder({ title, hint }) {
  return (
    <main>
      <h1>{title}</h1>
      {hint ? <p>{hint}</p> : null}
      <p>
        <Link to="/dashboard">Go to your wellbeing overview</Link>
      </p>
    </main>
  )
}

// Every page gets the same nav shell so no screen is a dead end; protected
// pages additionally require a signed-in user.
function Shell({ children, needsAuth, landing = false }) {
  const content = <AppShell variant={landing ? 'landing' : 'app'}>{children}</AppShell>
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
              <Shell landing>
                <HomePage />
              </Shell>
            }
          />

          <Route
            path="/dashboard"
            element={
              <Shell needsAuth>
                <WellbeingOverviewPage />
              </Shell>
            }
          />
          <Route
            path="/wellbeing"
            element={
              <Shell needsAuth>
                <WellbeingOverviewPage />
              </Shell>
            }
          />
          <Route
            path="/trends"
            element={
              <Shell needsAuth>
                <EnergyOverTimePage />
              </Shell>
            }
          />
          <Route
            path="/energy-over-time"
            element={
              <Shell needsAuth>
                <EnergyOverTimePage />
              </Shell>
            }
          />
          <Route
            path="/check-in"
            element={
              <Shell needsAuth>
                <ReflectionPage />
              </Shell>
            }
          />
          <Route
            path="/reflection"
            element={
              <Shell needsAuth>
                <ReflectionPage />
              </Shell>
            }
          />
          <Route
            path="/insights"
            element={
              <Shell needsAuth>
                <PatternsAndBoundariesPage />
              </Shell>
            }
          />
          <Route
            path="/patterns"
            element={
              <Shell needsAuth>
                <PatternsAndBoundariesPage />
              </Shell>
            }
          />
          <Route
            path="/settings"
            element={
              <Shell needsAuth>
                <PrivacyAndSettingsPage />
              </Shell>
            }
          />
          <Route
            path="/privacy"
            element={
              <Shell needsAuth>
                <PrivacyAndSettingsPage />
              </Shell>
            }
          />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
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
