import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Controllable Clerk session state for the topbar account control.
const authState = vi.hoisted(() => ({
  isSignedIn: false,
}));

vi.mock("@clerk/clerk-react", () => ({
  ClerkProvider: ({ children }) => <>{children}</>,
  RedirectToSignIn: () => <p>Redirecting to sign-in</p>,
  SignedIn: ({ children }) => (authState.isSignedIn ? <>{children}</> : null),
  SignedOut: ({ children }) =>
    !authState.isSignedIn ? <>{children}</> : null,
  SignInButton: ({ children }) => <>{children}</>,
  UserButton: () => <div data-testid="clerk-user-button" />,
  useAuth: () => ({
    getToken: vi.fn(async () => "test-token"),
    isLoaded: true,
    isSignedIn: authState.isSignedIn,
  }),
}));

let AccountButton;
let AuthProvider;

beforeAll(async () => {
  vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "pk_test_account");
  ({ AuthProvider } = await import("./auth.jsx"));
  ({ default: AccountButton } = await import("./AccountButton.jsx"));
});

// The stubbed key must not leak into other test files sharing this worker:
// their auth module would evaluate with Clerk "enabled" and render nulls.
afterAll(() => {
  vi.unstubAllEnvs();
});

function renderAccount() {
  // Mirror the real router: AccountButton always renders inside AuthProvider.
  return render(
    <AuthProvider>
      <AccountButton id="test-topbar-account" />
    </AuthProvider>,
  );
}

describe("AccountButton Clerk session states", () => {
  it("shows the Clerk UserButton once the user is signed in", () => {
    authState.isSignedIn = true;
    renderAccount();
    expect(screen.getByTestId("clerk-user-button")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign in" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Profile options" }),
    ).not.toBeInTheDocument();
  });

  it("shows a Sign in button when signed out with Clerk enabled", () => {
    authState.isSignedIn = false;
    renderAccount();
    expect(
      screen.getByRole("button", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("clerk-user-button"),
    ).not.toBeInTheDocument();
  });
});
