import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { AccountDeletionState } from "./account-deletion";

const { replace, signOut, requestAccountDeletion, cancelAccountDeletion } = vi.hoisted(() => ({
  replace: vi.fn(), signOut: vi.fn(), requestAccountDeletion: vi.fn(), cancelAccountDeletion: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: true }), useClerk: () => ({ signOut }), useReverification: (fetcher: () => unknown) => fetcher,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/api/authenticated-client", () => ({ useAuthenticatedApiClient: () => ({ requestAccountDeletion, cancelAccountDeletion }) }));

describe("AccountDeletionState", () => {
  beforeEach(() => { replace.mockReset(); signOut.mockReset(); requestAccountDeletion.mockReset(); cancelAccountDeletion.mockReset(); });

  it("requests deletion only through the authenticated API then revokes the browser session", async () => {
    requestAccountDeletion.mockResolvedValue({ scheduled: true, recoveryEndsAt: "2026-08-23T00:00:00Z" });
    signOut.mockResolvedValue(undefined);
    render(<AccountDeletionState state="confirmation" />);
    expect(screen.getByText(/independent backup deletion and recovery guarantees/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(requestAccountDeletion).toHaveBeenCalledOnce());
    expect(signOut).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/account/privacy/scheduled");
  });

  it("requires the email-link token before cancelling a scheduled deletion", async () => {
    cancelAccountDeletion.mockResolvedValue(undefined);
    window.history.replaceState({}, "", "/account/privacy/cancel#token=recovery-token");
    render(<AccountDeletionState state="scheduled" />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion" }));
    await waitFor(() => expect(cancelAccountDeletion).toHaveBeenCalledWith("recovery-token"));
    expect(replace).toHaveBeenCalledWith("/account");
    window.history.replaceState({}, "", "/");
  });
});
