import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Controllable Clerk session state for the gated check-in entry point.
const authState = vi.hoisted(() => ({
  isSignedIn: false,
  openSignIn: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  ClerkProvider: ({ children }) => <>{children}</>,
  RedirectToSignIn: () => <p>Redirecting to sign-in</p>,
  SignedIn: ({ children }) => (authState.isSignedIn ? <>{children}</> : null),
  SignedOut: ({ children }) =>
    !authState.isSignedIn ? <>{children}</> : null,
  SignInButton: ({ children }) => <>{children}</>,
  useClerk: () => ({ openSignIn: authState.openSignIn }),
  useAuth: () => ({
    getToken: vi.fn(async () => "test-token"),
    isLoaded: true,
    isSignedIn: authState.isSignedIn,
  }),
}));

let AuthGatedLink;
let AuthProvider;

beforeAll(async () => {
  vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "pk_test_gated");
  ({ AuthProvider } = await import("./auth.jsx"));
  ({ default: AuthGatedLink } = await import("./AuthGatedLink.jsx"));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function renderLink() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <AuthGatedLink to="/check-in" className="calm-hero__cta">
          Start a check-in
        </AuthGatedLink>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("AuthGatedLink", () => {
  it("navigates straight to the check-in page when signed in", () => {
    authState.isSignedIn = true;
    renderLink();
    expect(
      screen.getByRole("link", { name: "Start a check-in" }),
    ).toHaveAttribute("href", "/check-in");
    expect(
      screen.queryByRole("button", { name: "Start a check-in" }),
    ).not.toBeInTheDocument();
  });

  it("opens the Clerk sign-in modal instead of navigating when signed out", () => {
    authState.isSignedIn = false;
    authState.openSignIn.mockClear();
    renderLink();
    const button = screen.getByRole("button", { name: "Start a check-in" });
    expect(button).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Start a check-in" }),
    ).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(authState.openSignIn).toHaveBeenCalledWith(
      expect.objectContaining({
        forceRedirectUrl: "/check-in",
        fallbackRedirectUrl: "/check-in",
        signInForceRedirectUrl: "/check-in",
        signInFallbackRedirectUrl: "/check-in",
      }),
    );
  });
});












