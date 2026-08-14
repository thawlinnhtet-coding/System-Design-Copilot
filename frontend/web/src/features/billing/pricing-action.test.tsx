import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { PricingAction } from "./pricing-action";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const api = vi.hoisted(() => ({ getUsage: vi.fn(), startCheckout: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => session,
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

describe("PricingAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getUsage.mockResolvedValue({ plan: "FREE", billing: { checkoutAvailable: true } });
  });

  it("routes signed-out users to the custom sign-in page", () => {
    session.isSignedIn = false;

    renderWithProviders(<PricingAction pro />);

    expect(screen.getByRole("link", { name: "Sign in to upgrade" })).toHaveAttribute("href", "/sign-in");
  });

	  it("shows the checkout action and displays the environment restriction from the backend", async () => {
    session.isSignedIn = true;
    api.startCheckout.mockRejectedValue({ status: 403 });

    renderWithProviders(<PricingAction pro />);
    fireEvent.click(await screen.findByRole("button", { name: "Upgrade to Pro" }));

    await waitFor(() => expect(api.startCheckout).toHaveBeenCalledTimes(1));
	  expect(await screen.findByRole("alert")).toHaveTextContent("Pro Checkout is not enabled for this environment");
  });

  it("explains when the user already has Pro access", async () => {
    session.isSignedIn = true;
    api.startCheckout.mockRejectedValue({ status: 409 });

    renderWithProviders(<PricingAction pro />);
    fireEvent.click(await screen.findByRole("button", { name: "Upgrade to Pro" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already have Pro access");
  });

  it("does not present paid checkout to ordinary personal-beta users", async () => {
    session.isSignedIn = true;
    api.getUsage.mockResolvedValue({ plan: "FREE", billing: { status: "FREE_BETA", checkoutAvailable: false } });

    renderWithProviders(<PricingAction pro />);

    expect(await screen.findByRole("button", { name: "Upgrade unavailable in beta" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Ordinary personal-beta accounts stay on Free");
    expect(api.startCheckout).not.toHaveBeenCalled();
  });
});
