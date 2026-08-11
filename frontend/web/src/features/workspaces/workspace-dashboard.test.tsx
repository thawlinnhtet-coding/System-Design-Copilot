import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { WorkspaceDashboard } from "./workspace-dashboard";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));
const api = vi.hoisted(() => ({
  getWorkspaces: vi.fn(),
  getUsage: vi.fn(),
  createWorkspace: vi.fn(),
  renameWorkspace: vi.fn(),
  archiveWorkspace: vi.fn(),
  restoreWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
}));
const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => session,
  SignInButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  UserButton: () => <button type="button">Account</button>,
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

describe("WorkspaceDashboard", () => {
  beforeEach(() => {
    session.isLoaded = true;
    session.isSignedIn = false;
    vi.clearAllMocks();
    router.push.mockReset();
  });

  it("asks signed-out visitors to sign in", () => {
    render(<WorkspaceDashboard />);

    expect(screen.getByRole("button", { name: "Sign in to continue" })).toBeVisible();
    expect(api.getWorkspaces).not.toHaveBeenCalled();
  });

  it("shows owned Workspaces and creates a blank custom Workspace", async () => {
    session.isSignedIn = true;
    api.getWorkspaces.mockResolvedValue([
      {
        id: "workspace-1",
        name: "News feed",
        description: "Design the feed pipeline",
        source: "CUSTOM",
        status: "ACTIVE",
        progressPercent: 25,
        saveState: "SAVED",
      },
    ]);
    api.getUsage.mockResolvedValue({ activeWorkspaces: { used: 1, limit: 10 } });
    api.createWorkspace.mockResolvedValue({
      id: "workspace-2",
      name: "Ticket booking",
      description: "Avoid double booking",
      source: "CUSTOM",
      status: "ACTIVE",
      progressPercent: 0,
      saveState: "NOT_STARTED",
    });

    render(<WorkspaceDashboard />);

    expect(await screen.findByText("News feed")).toBeVisible();
    fireEvent.change(screen.getByLabelText("System name"), { target: { value: "Ticket booking" } });
    fireEvent.change(screen.getByLabelText("What are you designing?"), { target: { value: "Avoid double booking" } });
    fireEvent.click(screen.getByRole("button", { name: "Create blank workspace" }));

    await waitFor(() => expect(api.createWorkspace).toHaveBeenCalledWith("Ticket booking", "Avoid double booking"));
    expect(await screen.findByText("Ticket booking")).toBeVisible();
    expect(screen.getAllByText("CUSTOM", { selector: "p" })).toHaveLength(2);
  });

  it("offers a continue action for an active Workspace", async () => {
    session.isSignedIn = true;
    api.getWorkspaces.mockResolvedValue([
      { id: "workspace-1", name: "News feed", description: "Design the feed pipeline", status: "ACTIVE", progressPercent: 25, saveState: "SAVED" },
    ]);
    api.getUsage.mockResolvedValue({ activeWorkspaces: { used: 1, limit: 10 } });

    render(<WorkspaceDashboard />);

    expect(await screen.findByRole("link", { name: "Continue Workspace" })).toHaveAttribute("href", "/workspace/workspace-1");
  });
});
