import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AppShell } from "./app-shell";

const api = vi.hoisted(() => ({ getUsage: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({
  SignOutButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
  useUser: () => ({ user: { fullName: "Thaw Linn Htet", primaryEmailAddress: { emailAddress: "thaw@example.com" } } }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

describe("AppShell account menu", () => {
  beforeEach(() => {
    api.getUsage.mockResolvedValue({ plan: "FREE", activeWorkspaces: { used: 2, limit: 10 } });
  });

  it("opens the Pencil-matched overview action and keeps profile details separate", async () => {
    render(<AppShell><div>Page content</div></AppShell>);

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));

    expect(await screen.findByTestId("account-menu")).toBeVisible();
    expect(screen.getByTestId("account-settings-overview-link")).toHaveAttribute("href", "/account");
    expect(screen.getByRole("menuitem", { name: /Profile & security/ })).toHaveAttribute("href", "/account/profile");
  });
});
