import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import CheckInPage from '../features/checkins/pages/CheckInPage.jsx'
import DashboardPage from '../features/reminders/pages/DashboardPage.jsx'
import InsightsPage from '../features/insights/pages/InsightsPage.jsx'

function Placeholder({ title, hint }) {
  return (
    <main>
      <h1>{title}</h1>
      {hint ? <p>{hint}</p> : null}
      <nav aria-label="Primary">
        <Link to="/">Home</Link> · <Link to="/dashboard">Dashboard</Link> ·{' '}
        <Link to="/check-in">Check-In</Link> · <Link to="/insights">Insights</Link>
      </nav>
    </main>
  )
}

// No route protection yet: real auth lands before the external beta
// (TechDesign). VITE_DEV_AUTH_BYPASS only skips future UI redirects.
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Placeholder
              title="Steady-Ahh"
              hint="Foundation scaffold — calm UI lands with the feature phases."
            />
          }
        />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Routes>
    </BrowserRouter>
  )
}
