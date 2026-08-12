import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AccountDetail } from "./account-detail";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const user = vi.hoisted(() => ({ fullName: "Thaw Linn Htet", primaryEmailAddress: { emailAddress: "thaw@example.com" } }));
const api = vi.hoisted(() => ({ getUsage: vi.fn(), startCheckout: vi.fn(), openBillingPortal: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => session,
  useClerk: () => ({ openUserProfile: vi.fn() }),
  useSession: () => ({ session: { id: "session-1" } }),
  useUser: () => ({ user }),
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

describe("AccountDetail", () => {
  beforeEach(() => {
    session.isLoaded = true;
    session.isSignedIn = true;
    api.getUsage.mockReset();
  });

  it("renders the separate Profile & security detail state", () => {
    render(<AccountDetail section="profile" />);

    expect(screen.getByTestId("account-settings-sidebar")).toBeVisible();
    expect(screen.getByText("Personal information")).toBeVisible();
    expect(screen.getByText("Email address")).toBeVisible();
    expect(screen.getByRole("button", { name: /Manage active sessions/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Change password/ })).toBeVisible();
  });

  it("renders plan usage detail with current allowance rows", async () => {
    api.getUsage.mockResolvedValue({
      plan: "FREE",
      activeWorkspaces: { used: 2, limit: 10 },
      copilotTurns: { used: 12, limit: 50 },
      reviews: { used: 5, limit: 5 },
    });

    render(<AccountDetail section="plan" />);

    expect(await screen.findByText("Free personal beta")).toBeVisible();
    expect(screen.getByText("Active Workspaces")).toBeVisible();
    expect(screen.getByText("5 / 5 this month")).toBeVisible();
  });

  it("renders the Pro state with secure billing management", async () => {
    api.getUsage.mockResolvedValue({
      plan: "PRO",
      activeWorkspaces: { used: 3, limit: null },
      copilotTurns: { used: 12, limit: null },
      reviews: { used: 2, limit: null },
      renewsAt: "2026-09-10T00:00:00Z",
    });

    render(<AccountDetail section="plan" />);

    expect(await screen.findByText("Your Pro plan.")).toBeVisible();
    expect(screen.getByRole("button", { name: /Manage billing/ })).toBeVisible();
    expect(screen.getByText("Manage billing includes payment details, invoices, and cancellation.")).toBeVisible();
    expect(screen.queryByText("FAIR USE")).not.toBeInTheDocument();
  });
});
