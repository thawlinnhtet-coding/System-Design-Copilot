import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
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

  it("separates active and archived workspaces and confirms permanent deletion", async () => {
    api.getWorkspaces.mockResolvedValue([
      { id: "active-1", name: "Notifications", status: "ACTIVE", progressPercent: 38, saveState: "SAVED" },
      { id: "archived-1", name: "Image pipeline", status: "ARCHIVED", progressPercent: 61, saveState: "SAVED" },
    ]);
    renderWithProviders(<WorkspaceManagement />);
    expect(await screen.findByText("Notifications")).toBeVisible();
    expect(screen.getByRole("link", { name: "BACK TO PRACTICE" })).toHaveAttribute("href", "/practice");
    expect(screen.getByText("Image pipeline")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Delete Image pipeline?");
    fireEvent.click(screen.getByRole("button", { name: "Delete Workspace" }));
    await waitFor(() => expect(api.deleteWorkspace).toHaveBeenCalledWith("archived-1"));
  });
});
