import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function SignUpPage() {
  return (
    <main>
      <h1>Create your account</h1>
      <SignUp />
      <p>
        <Link to="/">Home</Link>
      </p>
    </main>
  )
}
