import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { PricingAction } from "./pricing-action";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const api = vi.hoisted(() => ({ startCheckout: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => session,
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

describe("PricingAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes signed-out users to the custom sign-in page", () => {
    session.isSignedIn = false;

    render(<PricingAction pro />);

    expect(screen.getByRole("link", { name: "Sign in to upgrade" })).toHaveAttribute("href", "/sign-in");
  });

	  it("shows the checkout action and displays the environment restriction from the backend", async () => {
    session.isSignedIn = true;
    api.startCheckout.mockRejectedValue({ status: 403 });

    render(<PricingAction pro />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }));

    await waitFor(() => expect(api.startCheckout).toHaveBeenCalledTimes(1));
	  expect(await screen.findByRole("alert")).toHaveTextContent("Pro Checkout is not enabled for this environment");
  });

  it("explains when the user already has Pro access", async () => {
    session.isSignedIn = true;
    api.startCheckout.mockRejectedValue({ status: 409 });

    render(<PricingAction pro />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already have Pro access");
  });
});
