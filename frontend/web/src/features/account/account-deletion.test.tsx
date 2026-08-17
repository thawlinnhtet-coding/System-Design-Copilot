import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { AccountDeletionState } from "./account-deletion";

const { replace, signOut, requestAccountDeletion } = vi.hoisted(() => ({
	replace: vi.fn(), signOut: vi.fn(), requestAccountDeletion: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isSignedIn: true }), useClerk: () => ({ signOut }) }));
vi.mock("@/lib/api/authenticated-client", () => ({ useAuthenticatedApiClient: () => ({ requestAccountDeletion }) }));

describe("AccountDeletionState", () => {
	beforeEach(() => { replace.mockReset(); signOut.mockReset(); requestAccountDeletion.mockReset(); });

	it("deletes immediately after the confirmation", async () => {
		requestAccountDeletion.mockResolvedValue(undefined);
		signOut.mockResolvedValue(undefined);
		render(<AccountDeletionState />);

		expect(screen.getByText(/permanently removes your account/i)).toBeVisible();
		expect(screen.getByRole("link", { name: "Keep my account" })).toBeVisible();
		expect(screen.queryByText("Request export")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Delete account" }));

		await waitFor(() => expect(requestAccountDeletion).toHaveBeenCalledOnce());
		expect(signOut).toHaveBeenCalledOnce();
		expect(replace).toHaveBeenCalledWith("/");
	});
});
