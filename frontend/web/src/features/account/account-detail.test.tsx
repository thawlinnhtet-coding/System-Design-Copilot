import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { AccountDetail } from "./account-detail";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const user = vi.hoisted(() => ({ fullName: "Thaw Linn Htet", primaryEmailAddress: { emailAddress: "thaw@example.com" } }));
const api = vi.hoisted(() => ({ getUsage: vi.fn(), getAiConsent: vi.fn(), grantAiConsent: vi.fn(), withdrawAiConsent: vi.fn(), startCheckout: vi.fn(), openBillingPortal: vi.fn() }));

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
    api.getAiConsent.mockReset();
    api.grantAiConsent.mockReset();
    api.withdrawAiConsent.mockReset();
  });

  it("renders the separate Profile & security detail state", () => {
    renderWithProviders(<AccountDetail section="profile" />);

    expect(screen.getByTestId("account-settings-sidebar")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Profile" })).toBeVisible();
    expect(screen.getByText("Email address")).toBeVisible();
    expect(screen.getByRole("button", { name: "Review sessions" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Manage sign-in" })).toBeVisible();
    expect(screen.getByText("Two-factor authentication")).toBeVisible();
  });

  it("renders plan usage detail with current allowance rows", async () => {
    api.getUsage.mockResolvedValue({
      plan: "FREE",
      activeWorkspaces: { used: 2, limit: 10 },
      copilotTurns: { used: 12, limit: 50 },
      reviews: { used: 5, limit: 5 },
    });

    renderWithProviders(<AccountDetail section="plan" />);

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

    renderWithProviders(<AccountDetail section="plan" />);

    expect(await screen.findByText("Your Pro plan.")).toBeVisible();
    expect(screen.getByRole("button", { name: /Manage billing/ })).toBeVisible();
    expect(screen.getByText("Manage billing includes payment details, invoices, and cancellation.")).toBeVisible();
    expect(screen.queryByText("FAIR USE")).not.toBeInTheDocument();
  });

  it("shows the bounded consent policy and lets the user grant consent", async () => {
    const policy = {
      currentVersion: "2026-08-01",
      includedCategories: ["Current Workspace Requirements and Architecture Document"],
      excludedCategories: ["Credentials, tokens, passwords, and authentication metadata"],
      providerRouting: "OpenRouter routes only to providers marked data_collection=deny with provider fallback disabled.",
      revocable: true,
      priorTransmissionNotice: "Context already sent to a provider cannot be retracted.",
    };
    api.getAiConsent.mockResolvedValue({ granted: false, policy });
    api.grantAiConsent.mockResolvedValue({ granted: true, policy });

    renderWithProviders(<AccountDetail section="ai" />);

    expect(await screen.findByText("Current Workspace Requirements and Architecture Document")).toBeVisible();
    expect(screen.getByText("Credentials, tokens, passwords, and authentication metadata")).toBeVisible();
    expect(screen.getByText(/There is no cross-Workspace context picker/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Grant consent" }));

    await waitFor(() => expect(api.grantAiConsent).toHaveBeenCalledWith("2026-08-01"));
    expect(await screen.findByRole("button", { name: "Revoke consent" })).toBeVisible();
  });

  it("keeps ordinary personal-beta users on Free without offering paid checkout", async () => {
    api.getUsage.mockResolvedValue({
      plan: "FREE",
      activeWorkspaces: { used: 10, limit: 10 },
      copilotTurns: { used: 50, limit: 50 },
      reviews: { used: 5, limit: 5 },
      billing: { status: "FREE_BETA", checkoutAvailable: false, portalAvailable: false },
    });

    renderWithProviders(<AccountDetail section="plan" />);

    expect(await screen.findByText("Free personal beta")).toBeVisible();
    expect(screen.getByRole("button", { name: "Upgrade unavailable in beta" })).toBeDisabled();
    expect(screen.getByText(/ordinary personal-beta accounts cannot activate paid Pro access/i)).toBeVisible();
  });

  it("shows Pro access through the paid-through date when cancellation is scheduled", async () => {
    api.getUsage.mockResolvedValue({
      plan: "PRO",
      activeWorkspaces: { used: 3, limit: null },
      copilotTurns: { used: 12, limit: null },
      reviews: { used: 2, limit: null },
      renewsAt: "2026-09-10T00:00:00Z",
      billing: { status: "PRO_CANCELING", checkoutAvailable: false, portalAvailable: true, paidThrough: "2026-09-10T00:00:00Z" },
    });

    renderWithProviders(<AccountDetail section="plan" />);

    expect(await screen.findByText("Your Pro plan continues through Sep 10, 2026.")).toBeVisible();
    expect(screen.getByText(/Cancellation scheduled.*access remains available until the paid-through date/)).toBeVisible();
  });

  it("offers a retry when plan and usage cannot be loaded", async () => {
    api.getUsage.mockRejectedValueOnce(new Error("offline"));

    renderWithProviders(<AccountDetail section="plan" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Plan and usage are temporarily unavailable");
    expect(screen.getByRole("button", { name: "Retry plan and usage" })).toBeVisible();

    api.getUsage.mockResolvedValueOnce({ plan: "FREE", activeWorkspaces: { used: 0, limit: 10 } });
    fireEvent.click(screen.getByRole("button", { name: "Retry plan and usage" }));
    await waitFor(() => expect(screen.getByText("Free personal beta")).toBeVisible());
  });
});
