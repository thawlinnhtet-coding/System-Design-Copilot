import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ApiRequestError } from "@/lib/api/authenticated-client";
import { ArchitectureReviewEntry } from "./architecture-review-entry";

const api = vi.hoisted(() => ({ createManualArchitectureReviewWorkspace: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@/lib/api/authenticated-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(public status: number) { super(); }
  },
  useAuthenticatedApiClient: () => api,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("ArchitectureReviewEntry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a manual review Workspace with a persisted Review Brief and optional reasoning", async () => {
    api.createManualArchitectureReviewWorkspace.mockResolvedValue({ id: "workspace-manual" });
    renderWithProviders(<ArchitectureReviewEntry />);

    fireEvent.change(screen.getByLabelText("Workspace name"), { target: { value: "Ticket booking" } });
    fireEvent.change(screen.getByLabelText("System description"), { target: { value: "A ticket booking system" } });
    fireEvent.change(screen.getByLabelText("Review goal"), { target: { value: "Check overselling" } });
    fireEvent.change(screen.getByLabelText("Known requirements"), { target: { value: "Never oversell a seat\nKeep checkout under 2 seconds" } });
    fireEvent.change(screen.getByLabelText("Known assumptions"), { target: { value: "Inventory is partitioned by venue" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Review Workspace" }));

    await waitFor(() => expect(api.createManualArchitectureReviewWorkspace).toHaveBeenCalledWith({
      name: "Ticket booking",
      systemDescription: "A ticket booking system",
      reviewGoal: "Check overselling",
      knownRequirements: ["Never oversell a seat", "Keep checkout under 2 seconds"],
      knownAssumptions: ["Inventory is partitioned by venue"],
    }, expect.any(String)));
    expect(router.push).toHaveBeenCalledWith("/workspace/workspace-manual");
  });

  it("points users to the validated import flow", () => {
    renderWithProviders(<ArchitectureReviewEntry />);

    expect(screen.getByRole("link", { name: "Import a package instead" })).toHaveAttribute("href", "/data");
    expect(screen.getByText("Import is previewed and server-validated before a Review Workspace is created.")).toBeVisible();
  });

  it("shows boundary validation before creating a Workspace", async () => {
    renderWithProviders(<ArchitectureReviewEntry />);

    fireEvent.click(screen.getByRole("button", { name: "Create Review Workspace" }));

    expect(await screen.findByText("Workspace name is required.")).toBeVisible();
    expect(api.createManualArchitectureReviewWorkspace).not.toHaveBeenCalled();
  });

  it("explains an active Workspace entitlement limit", async () => {
    api.createManualArchitectureReviewWorkspace.mockRejectedValue(new ApiRequestError(403));
    renderWithProviders(<ArchitectureReviewEntry />);

    fireEvent.change(screen.getByLabelText("Workspace name"), { target: { value: "Ticket booking" } });
    fireEvent.change(screen.getByLabelText("System description"), { target: { value: "A ticket booking system" } });
    fireEvent.change(screen.getByLabelText("Review goal"), { target: { value: "Check overselling" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Review Workspace" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("active Workspace limit");
  });
});
