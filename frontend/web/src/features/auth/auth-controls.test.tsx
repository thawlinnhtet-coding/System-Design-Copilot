import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { AuthControls } from "./auth-controls";

const session = vi.hoisted(() => ({ isSignedIn: false }));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: session.isSignedIn }),
  SignInButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  UserButton: () => <button type="button">Account</button>,
}));

describe("AuthControls", () => {
  it("provides Clerk controls for a signed-out session", () => {
    session.isSignedIn = false;
    render(<AuthControls />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  it("provides a Clerk account control for a restored signed-in session", () => {
    session.isSignedIn = true;
    render(<AuthControls />);

    expect(screen.getByRole("button", { name: "Account" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  });
});
