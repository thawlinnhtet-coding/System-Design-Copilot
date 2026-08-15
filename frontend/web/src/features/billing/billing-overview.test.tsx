import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { BillingOverview } from "./billing-overview";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));
const user = vi.hoisted(() => ({ primaryEmailAddress: { verification: { status: "verified" } } }));
const clerk = vi.hoisted(() => ({ openUserProfile: vi.fn() }));
const api = vi.hoisted(() => ({
  getUsage: vi.fn(),
  startCheckout: vi.fn(),
  openBillingPortal: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
	useAuth: () => session,
	useUser: () => ({ user }),
	useClerk: () => clerk,
  SignInButton: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

describe("BillingOverview", () => {
  beforeEach(() => {
    session.isLoaded = true;
    session.isSignedIn = false;
	vi.clearAllMocks();
	user.primaryEmailAddress.verification.status = "verified";
  });

  it("starts the backend checkout flow and explains when the environment is disabled", async () => {
    session.isSignedIn = true;
    api.getUsage.mockResolvedValue({ plan: "FREE", activeWorkspaces: { used: 0, limit: 10 }, billing: { checkoutAvailable: true, portalAvailable: false } });
    api.startCheckout.mockRejectedValue({ status: 403 });

    renderWithProviders(<BillingOverview />);
    fireEvent.click(await screen.findByRole("button", { name: /Upgrade to Pro/i }));

    await waitFor(() => expect(api.startCheckout).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("alert")).toHaveTextContent("Pro Checkout is not enabled for this environment");
  });

	it("keeps Workspace practice available in principle while sending unverified billing users to Clerk", async () => {
		session.isSignedIn = true;
		user.primaryEmailAddress.verification.status = "unverified";
		api.getUsage.mockResolvedValue({ plan: "FREE", activeWorkspaces: { used: 0, limit: 10 }, billing: { checkoutAvailable: true, portalAvailable: false } });

		renderWithProviders(<BillingOverview />);

		expect(await screen.findByRole("status")).toHaveTextContent("continue creating and saving private Workspaces");
		expect(screen.getByRole("button", { name: /Upgrade unavailable in beta/i })).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Verify email with Clerk" }));
		expect(clerk.openUserProfile).toHaveBeenCalledTimes(1);
	});
});
