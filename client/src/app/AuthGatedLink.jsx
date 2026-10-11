import { useAuth, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { clerkEnabled, useClerkActive } from './auth.jsx';

export default function AuthGatedLink({ to, className, children }) {
  const clerkActive = useClerkActive();
  if (!clerkEnabled || !clerkActive) {
    return <Link to={to} className={className}>{children}</Link>;
  }
  return <ClerkAuthGatedLink to={to} className={className}>{children}</ClerkAuthGatedLink>;
}

function ClerkAuthGatedLink({ to, className, children }) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  if (isSignedIn) {
    return <Link to={to} className={className}>{children}</Link>;
  }
  function handleClick(event) {
    event.preventDefault();
    openSignIn({
      forceRedirectUrl: to,
      fallbackRedirectUrl: to,
      signInForceRedirectUrl: to,
      signInFallbackRedirectUrl: to,
    });
  }
  return <button type='button' className={className} onClick={handleClick}>{children}</button>;
}
