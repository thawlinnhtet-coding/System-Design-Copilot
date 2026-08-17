import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { PracticeHome } from "./practice-home";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));
const api = vi.hoisted(() => ({
  getWorkspaces: vi.fn(),
  getUsage: vi.fn(),
  createWorkspace: vi.fn(),
  createCustomDesignWorkspace: vi.fn(),
  renameWorkspace: vi.fn(),
  archiveWorkspace: vi.fn(),
  restoreWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
}));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => session }));
vi.mock("@/lib/api/authenticated-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(public status: number) { super(); }
  },
  useAuthenticatedApiClient: () => api,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("PracticeHome", () => {
  beforeEach(() => {
    session.isLoaded = true;
    session.isSignedIn = false;
    vi.clearAllMocks();
    api.getUsage.mockResolvedValue({ activeWorkspaces: { used: 0, limit: 10 } });
  });

  it("preserves the practice destination for signed-out visitors", async () => {
    renderWithProviders(<PracticeHome />);
    expect(screen.getByRole("status")).toHaveTextContent("Taking you to sign in");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sign-in"));
  });

  it("renders owned workspaces without exposing internal challenge provenance", async () => {
    session.isSignedIn = true;
    api.getWorkspaces.mockResolvedValue([{ id: "workspace-1", name: "Reliable notification platform", status: "ACTIVE", type: "CHALLENGE", source: "CURATED_CHALLENGE", progressPercent: 38, saveState: "SAVED" }]);
    renderWithProviders(<PracticeHome />);
    expect(await screen.findByRole("link", { name: "Continue Clarify" })).toHaveAttribute("href", "/workspace/workspace-1");
    expect(screen.getByRole("link", { name: "Review existing architecture" })).toHaveAttribute("href", "/practice/review");
    expect(screen.queryByText(/CHALLENGE.*CURATED CHALLENGE/)).not.toBeInTheDocument();
    expect(screen.getByText(/CONTINUE WORKSPACE.*SAVED/)).toBeVisible();
    expect(screen.getByText("RECENT WORKSPACES")).toBeVisible();
    expect(screen.getByRole("link", { name: /Manage all/ })).toHaveAttribute("href", "/practice/workspaces");
    expect(screen.getByText("What delivery guarantee do downstream consumers actually need?")).toBeVisible();
  });

  it("creates a custom workspace through the backend", async () => {
    session.isSignedIn = true;
    api.getWorkspaces.mockResolvedValue([]);
    api.createCustomDesignWorkspace.mockResolvedValue({ id: "workspace-2" });
    renderWithProviders(<PracticeHome />);
    await screen.findByRole("button", { name: "Start custom design" });
    fireEvent.click(screen.getByRole("button", { name: "Start custom design" }));
    expect(await screen.findByRole("heading", { name: "Make the problem explicit." })).toBeVisible();
    expect(screen.getByRole("button", { name: /BACK TO PRACTICE/ })).toBeVisible();
    expect(screen.getAllByText("CUSTOM DESIGN")[0]).toBeVisible();
    expect(screen.queryByText("MANUAL RECREATION")).not.toBeInTheDocument();
    expect(screen.queryByText("IMPORT PACKAGE")).not.toBeInTheDocument();
    expect(screen.getByText(/Event ingestion platform/)).toBeVisible();
    expect(screen.getByText("0/120")).toBeVisible();
    expect(screen.getByText("0/2000")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "SYSTEM NAME" }), { target: { value: "Orders" } });
    fireEvent.change(screen.getByRole("textbox", { name: "WHAT ARE YOU DESIGNING?" }), { target: { value: "A reliable ordering system" } });
    fireEvent.click(screen.getByRole("button", { name: "Create blank Workspace →" }));
    await waitFor(() => expect(api.createCustomDesignWorkspace).toHaveBeenCalledWith("Orders", "A reliable ordering system"));
    expect(router.push).toHaveBeenCalledWith("/workspace/workspace-2");
  });

  it("returns to practice without creating a Workspace", async () => {
    session.isSignedIn = true;
    api.getWorkspaces.mockResolvedValue([]);
    renderWithProviders(<PracticeHome />);
    fireEvent.click(await screen.findByRole("button", { name: "Start custom design" }));
    fireEvent.click(screen.getByRole("button", { name: /BACK TO PRACTICE/ }));
    expect(screen.getByRole("button", { name: "Start custom design" })).toBeVisible();
    expect(api.createCustomDesignWorkspace).not.toHaveBeenCalled();
  });

  it("blocks creation before submission when the active Workspace limit is reached", async () => {
    session.isSignedIn = true;
    api.getWorkspaces.mockResolvedValue([]);
    api.getUsage.mockResolvedValue({ activeWorkspaces: { used: 10, limit: 10 } });
    renderWithProviders(<PracticeHome />);
    fireEvent.click(await screen.findByRole("button", { name: "Start custom design" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("active Workspace limit (10/10)");
    expect(screen.getByRole("button", { name: /Create blank Workspace/ })).toBeDisabled();
    expect(api.createCustomDesignWorkspace).not.toHaveBeenCalled();
  });
});
