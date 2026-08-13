import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AccountSettings } from "./account-settings";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const user = vi.hoisted(() => ({
  fullName: "Thaw Linn Htet",
  firstName: "Thaw Linn",
  lastName: "Htet",
  primaryEmailAddress: { emailAddress: "thaw@example.com" },
}));
const api = vi.hoisted(() => ({ getUsage: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => session,
  useSession: () => ({ session: { id: "session-1" } }),
  useUser: () => ({ isLoaded: true, user }),
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

describe("AccountSettings", () => {
  beforeEach(() => {
    session.isLoaded = true;
    session.isSignedIn = true;
    api.getUsage.mockReset();
  });

  it("renders the approved account settings overview for a signed-in user", async () => {
    api.getUsage.mockResolvedValue({
      plan: "FREE",
      activeWorkspaces: { used: 2, limit: 10 },
      copilotTurns: { used: 38, limit: 50 },
    });

    render(<AccountSettings />);

    expect(await screen.findByText(/2\/10 Workspaces.*12 Copilot Turns remaining/)).toBeVisible();
    expect(screen.getAllByRole("heading", { name: "Account settings" })).toHaveLength(2);
    expect(screen.getByText("Thaw Linn Htet")).toBeVisible();
    expect(screen.getByText("PROFILE SUMMARY")).toBeVisible();
    expect(screen.getByText("ACCESS & SESSIONS")).toBeVisible();
    expect(screen.getByText("thaw@example.com · Verified")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open Profile & security →" })).toHaveAttribute("href", "/account/profile");
  });

  it("renders the authenticated Pro plan returned by the usage API", async () => {
    api.getUsage.mockResolvedValue({
      plan: "PRO",
      activeWorkspaces: { used: 3, limit: null },
      copilotTurns: { used: 12, limit: null },
      reviews: { used: 2, limit: null },
      renewsAt: "2026-09-10T00:00:00Z",
    });

    render(<AccountSettings />);

    expect((await screen.findAllByText("Pro")).length).toBeGreaterThan(0);
    expect(screen.getByText("Account type")).toBeVisible();
  });

  it("keeps account details private when signed out", () => {
    session.isSignedIn = false;

    render(<AccountSettings />);

    expect(screen.getByRole("button", { name: "Sign in to continue" })).toBeVisible();
    expect(api.getUsage).not.toHaveBeenCalled();
  });
});
