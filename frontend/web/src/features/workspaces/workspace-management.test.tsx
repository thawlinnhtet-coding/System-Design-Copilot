import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ApiRequestError } from "@/lib/api/authenticated-client";
import { WorkspaceManagement } from "./workspace-management";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const api = vi.hoisted(() => ({ getWorkspaces: vi.fn(), archiveWorkspace: vi.fn(), restoreWorkspace: vi.fn(), deleteWorkspace: vi.fn() }));
const router = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => session }));
vi.mock("@/lib/api/authenticated-client", () => ({
  ApiRequestError: class ApiRequestError extends Error { constructor(public status: number) { super(); } },
  useAuthenticatedApiClient: () => api,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("WorkspaceManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.isLoaded = true;
    session.isSignedIn = true;
  });

  it("separates active and archived workspaces and requires the exact name before deletion", async () => {
    api.getWorkspaces.mockResolvedValue([
      { id: "active-1", name: "Notifications", type: "CHALLENGE", source: "CURATED_CHALLENGE", status: "ACTIVE", progressPercent: 38, saveState: "SAVED" },
      { id: "archived-1", name: "Image pipeline", type: "CHALLENGE", source: "CURATED_CHALLENGE", status: "ARCHIVED", progressPercent: 61, saveState: "SAVED" },
    ]);
    renderWithProviders(<WorkspaceManagement />);
    expect(await screen.findByText("Notifications")).toBeVisible();
    expect(screen.queryByText(/CHALLENGE.*CURATED CHALLENGE/)).not.toBeInTheDocument();
    expect(screen.getByText("38% COMPLETE · SAVED")).toBeVisible();
    expect(screen.getByRole("link", { name: "BACK TO PRACTICE" })).toHaveAttribute("href", "/practice");
    expect(screen.getByText("Image pipeline")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Delete Image pipeline?");
    expect(screen.getByRole("button", { name: "Delete Workspace" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type Image pipeline to confirm."), { target: { value: "Image pipeline" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete Workspace" }));
    await waitFor(() => expect(api.deleteWorkspace).toHaveBeenCalledWith("archived-1", "Image pipeline"));
  });

  it("explains archive consequences before removing active capacity", async () => {
    api.getWorkspaces.mockResolvedValue([{ id: "active-1", name: "Notifications", status: "ACTIVE", progressPercent: 38, saveState: "SAVED" }]);
    renderWithProviders(<WorkspaceManagement />);

    await screen.findByText("Notifications");
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("become read-only and stop using an active-Workspace allowance");
    fireEvent.click(screen.getByRole("button", { name: "Archive Workspace" }));
    await waitFor(() => expect(api.archiveWorkspace).toHaveBeenCalledWith("active-1"));
  });

  it("keeps the Workspace visible when restoration is blocked by capacity", async () => {
    api.getWorkspaces.mockResolvedValue([{ id: "archived-1", name: "Image pipeline", status: "ARCHIVED", progressPercent: 61, saveState: "SAVED" }]);
    api.restoreWorkspace.mockRejectedValue(new ApiRequestError(403));
    renderWithProviders(<WorkspaceManagement />);

    await screen.findByText("Image pipeline");
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("active Workspace allowance is full");
    expect(screen.getByText("Image pipeline")).toBeVisible();
  });
});
