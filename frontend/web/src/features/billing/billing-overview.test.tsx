import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { BillingOverview } from "./billing-overview";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));
const api = vi.hoisted(() => ({
  getUsage: vi.fn(),
  startCheckout: vi.fn(),
  openBillingPortal: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => session,
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
});
