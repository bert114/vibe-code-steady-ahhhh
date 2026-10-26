import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { clerkEnabled, useClerkActive } from '../../../app/auth.jsx'

export default function SignUpPage() {
  const clerkActive = useClerkActive()

  return (
    <main className="auth-page">
      <h1>Create your account</h1>
      {clerkEnabled && clerkActive ? (
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
        />
      ) : (
        <div className="auth-fallback-box" role="status">
          <p>Local development mode is active without external authentication.</p>
          <p>Your session is automatically provisioned for local testing.</p>
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
