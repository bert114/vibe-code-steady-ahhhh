import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function SignInPage() {
  return (
    <main>
      <h1>Welcome back</h1>
      <SignIn />
      <p>
        <Link to="/">Home</Link>
      </p>
    </main>
  )
}
