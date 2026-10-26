import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { clerkEnabled, useClerkActive } from "./auth.jsx";

// Dev-bypass fallback: the same placeholder avatar menu the shell used in
// the sidebar, now rendered in the topbar so layout stays testable without
// Clerk keys.
export function ProfilePlaceholder({ id, onNavigate }) {
  const [open, setOpen] = useState(false);
  const profileRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div
      className="workspace-profile workspace-profile--topbar"
      ref={profileRef}
    >
      <button
        ref={triggerRef}
        type="button"
        className="workspace-profile__trigger"
        aria-label="Profile options"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="workspace-profile__avatar" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 20c.6-3.3 2.8-5 6.5-5s5.9 1.7 6.5 5" />
          </svg>
        </span>
        <span className="workspace-profile__label">Profile</span>
        <svg
          className="workspace-profile__chevron"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      <div className="workspace-profile__menu" id={id} hidden={!open}>
        <p>Profile setup is coming later.</p>
        <Link
          to="/settings"
          onClick={() => {
            setOpen(false);
            onNavigate?.();
          }}
        >
          Open settings
        </Link>
      </div>
    </div>
  );
}

// Topbar account control. Inside a Clerk session it renders the real
// UserButton (SignedIn) plus a Sign in button (SignedOut, e.g. landing).
// Without Clerk keys it falls back to the placeholder avatar.
export default function AccountButton({
  id = "workspace-topbar-account",
  onNavigate,
}) {
  const clerkActive = useClerkActive();

  if (clerkEnabled && clerkActive) {
    return (
      <div className="workspace-topbar__account">
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "workspace-topbar__avatar",
                userButtonPopoverCard:
                  "workspace-profile__menu workspace-profile__menu--clerk",
              },
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal" forceRedirectUrl="/check-in" fallbackRedirectUrl="/check-in" signInForceRedirectUrl="/check-in" signInFallbackRedirectUrl="/check-in">
            <button type="button" className="workspace-topbar__sign-in">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    );
  }

  return (
    <div className="workspace-topbar__account">
      <ProfilePlaceholder id={id} onNavigate={onNavigate} />
    </div>
  );
}


