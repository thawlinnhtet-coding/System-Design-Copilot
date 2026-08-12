import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AccountDeletionState } from "./account-deletion";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("AccountDeletionState", () => {
  beforeEach(() => replace.mockReset());

  it("moves from confirmation to the scheduled state", () => {
    render(<AccountDeletionState state="confirmation" />);

    expect(screen.getByRole("heading", { name: "Delete your account?" })).toBeVisible();
    expect(screen.getByText(/cancel this request for 7 days/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));

    expect(replace).toHaveBeenCalledWith("/account/privacy/scheduled");
  });

  it("shows the recovery action for a scheduled deletion", () => {
    render(<AccountDeletionState state="scheduled" />);

    expect(screen.getByRole("heading", { name: "Your account is scheduled for deletion" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel deletion" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion" }));

    expect(replace).toHaveBeenCalledWith("/account/privacy");
  });
});
