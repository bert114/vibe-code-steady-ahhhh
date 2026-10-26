import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  useAuth,
} from "@clerk/clerk-react";
import { createContext, useContext, useEffect } from "react";
import { clearTokenGetter, setTokenGetter } from "../lib/api/authToken.js";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
export const clerkEnabled = PUBLISHABLE_KEY !== "";

const ClerkContext = createContext({ clerkActive: false });

export function useClerkActive() {
  return useContext(ClerkContext).clerkActive;
}

// Renders children only for a signed-in Clerk user. Without Clerk keys
// (local dev bypass) there is no session to read, so the fallback renders.
export function SignedInView({ children, fallback = null }) {
  const clerkActive = useClerkActive();
  if (!clerkEnabled || !clerkActive) {
    return <>{fallback}</>;
  }
  return <SignedIn>{children}</SignedIn>;
}

// Renders children only for a signed-out visitor. Without Clerk keys the
// visitor is treated as signed out, so children render.
export function SignedOutView({ children }) {
  const clerkActive = useClerkActive();
  if (!clerkEnabled || !clerkActive) {
    return <>{children}</>;
  }
  return <SignedOut>{children}</SignedOut>;
}

// Registers a fresh-token getter so every API call carries the current
// Clerk session JWT. Runs only inside ClerkProvider.
function ClerkTokenSync() {
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    if (!isSignedIn) {
      clearTokenGetter();
      return;
    }
    setTokenGetter(() => getToken());
    return () => clearTokenGetter();
  }, [getToken, isSignedIn]);
  return null;
}

export function AuthProvider({ children }) {
  if (!clerkEnabled) {
    // Local dev without Clerk keys: server dev bypass resolves the user.
    return (
      <ClerkContext.Provider value={{ clerkActive: false }}>
        {children}
      </ClerkContext.Provider>
    );
  }
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <ClerkContext.Provider value={{ clerkActive: true }}>
        <ClerkTokenSync />
        {children}
      </ClerkContext.Provider>
    </ClerkProvider>
  );
}

// Gate for routes that need a signed-in user. Without Clerk keys this is a
// passthrough (dev bypass); with Clerk it waits for the session to load and
// then redirects strangers to sign-in.
export function RequireAuth({ children }) {
  const clerkActive = useClerkActive();
  if (!clerkEnabled || !clerkActive) {
    return <>{children}</>;
  }
  return <ClerkGate>{children}</ClerkGate>;
}

// Runs only inside ClerkProvider. The isLoaded wait is load-bearing: after
// an external auth redirect (sign-up, SSO) Clerk lands back on the return
// URL with handshake query params (?__clerk_handshake=…) and needs a moment
// to exchange them for a session. Redirecting while !isLoaded would drop
// those params and the sign-in could never complete on that URL.
function ClerkGate({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <main className="auth-loading" role="status">
        <p>Getting your space ready…</p>
      </main>
    );
  }
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  return <>{children}</>;
}
