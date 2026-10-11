import { SignInButton, useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { clerkEnabled, useClerkActive } from "./auth.jsx";

// A router link that becomes a sign-in prompt when the visitor is signed out.
// Signed in (or running the no-Clerk dev bypass) it is a normal Link; signed
// out with Clerk active it opens the Clerk sign-in modal in place, matching
// the topbar Sign in button, then redirects to `to` after a successful sign in.
export default function AuthGatedLink({ to, className, children }) {
  const clerkActive = useClerkActive();
  if (!clerkEnabled || !clerkActive) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <ClerkAuthGatedLink to={to} className={className}>
      {children}
    </ClerkAuthGatedLink>
  );
}

// Runs only inside ClerkProvider so useAuth/SignInButton are safe to use.
function ClerkAuthGatedLink({ to, className, children }) {
  const { isSignedIn } = useAuth();
  if (isSignedIn) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <SignInButton mode="modal" forceRedirectUrl={to}>
      <button type="button" className={className}>
        {children}
      </button>
    </SignInButton>
  );
}
