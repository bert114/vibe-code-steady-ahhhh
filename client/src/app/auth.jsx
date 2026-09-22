import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { clearTokenGetter, setTokenGetter } from '../lib/api/authToken.js'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''
export const clerkEnabled = PUBLISHABLE_KEY !== ''

// Registers a fresh-token getter so every API call carries the current
// Clerk session JWT. Runs only inside ClerkProvider.
function ClerkTokenSync() {
  const { getToken, isSignedIn } = useAuth()
  useEffect(() => {
    if (!isSignedIn) {
      clearTokenGetter()
      return
    }
    setTokenGetter(() => getToken())
    return () => clearTokenGetter()
  }, [getToken, isSignedIn])
  return null
}

export function AuthProvider({ children }) {
  if (!clerkEnabled) {
    // Local dev without Clerk keys: server dev bypass resolves the user.
    return <>{children}</>
  }
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ClerkTokenSync />
      {children}
    </ClerkProvider>
  )
}

// Gate for routes that need a signed-in user. Without Clerk keys this is a
// passthrough (dev bypass); with Clerk it redirects strangers to sign-in.
export function RequireAuth({ children }) {
  if (!clerkEnabled) {
    return <>{children}</>
  }
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
