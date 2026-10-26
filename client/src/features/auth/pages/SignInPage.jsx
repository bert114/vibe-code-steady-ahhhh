import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { clerkEnabled, useClerkActive } from '../../../app/auth.jsx'

export default function SignInPage() {
  const clerkActive = useClerkActive()

  return (
    <main className="auth-page">
      <h1>Welcome back</h1>
      {clerkEnabled && clerkActive ? (
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      ) : (
        <div className="auth-fallback-box" role="status">
          <p>Local development mode is active without external authentication.</p>
          <p>Your session is automatically authenticated.</p>
          <p>
            <Link to="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          </p>
        </div>
      )}
      <p>
        <Link to="/">Home</Link>
      </p>
    </main>
  )
}
