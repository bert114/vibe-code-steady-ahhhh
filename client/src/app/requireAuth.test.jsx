import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Controllable Clerk session state. Mirrors the real handshake sequence:
// Clerk reports signed-out while still loading (!isLoaded), then flips to
// signed-in once the ?__clerk_handshake=… params are exchanged.
const authState = vi.hoisted(() => ({
  isLoaded: false,
  isSignedIn: false,
}));

vi.mock("@clerk/clerk-react", () => ({
  ClerkProvider: ({ children }) => <>{children}</>,
  RedirectToSignIn: () => <p>Redirecting to sign-in</p>,
  useAuth: () => ({
    getToken: vi.fn(async () => "test-token"),
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
  }),
}));

let AuthProvider;
let RequireAuth;

beforeAll(async () => {
  vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "pk_test_handshake");
  ({ AuthProvider, RequireAuth } = await import("./auth.jsx"));
});

// The stubbed key must not leak into other test files sharing this worker:
// their auth module would evaluate with Clerk "enabled" and render nulls.
afterAll(() => {
  vi.unstubAllEnvs();
});

function renderGate() {
  return render(
    <AuthProvider>
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    </AuthProvider>,
  );
}

describe("RequireAuth Clerk handshake gate", () => {
  it("holds on a loading state while Clerk initializes instead of redirecting", () => {
    authState.isLoaded = false;
    authState.isSignedIn = false;
    renderGate();
    // The return URL (with ?__clerk_handshake=…) must stay intact so the
    // handshake can finish; bouncing to sign-in here drops those params and
    // the sign-in can never complete on that URL.
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/getting your space ready/i)).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Redirecting to sign-in"),
    ).not.toBeInTheDocument();
  });

  it("redirects to sign-in once loaded and still signed out", () => {
    authState.isLoaded = true;
    authState.isSignedIn = false;
    renderGate();
    expect(screen.getByText("Redirecting to sign-in")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders protected content once signed in", () => {
    authState.isLoaded = true;
    authState.isSignedIn = true;
    renderGate();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(
      screen.queryByText("Redirecting to sign-in"),
    ).not.toBeInTheDocument();
  });
});
