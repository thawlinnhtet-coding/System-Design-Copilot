import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { PracticeHome } from "./practice-home";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));
const api = vi.hoisted(() => ({ getWorkspaces: vi.fn(), createWorkspace: vi.fn(), renameWorkspace: vi.fn(), archiveWorkspace: vi.fn(), restoreWorkspace: vi.fn(), deleteWorkspace: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => session }));
vi.mock("@/lib/api/authenticated-client", () => ({ ApiRequestError: class ApiRequestError extends Error { constructor(public status: number) { super(); } }, useAuthenticatedApiClient: () => api }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("PracticeHome", () => {
  beforeEach(() => { session.isLoaded = true; session.isSignedIn = false; vi.clearAllMocks(); });

  it("preserves the practice destination for signed-out visitors", async () => {
    renderWithProviders(<PracticeHome />);
    expect(screen.getByRole("status")).toHaveTextContent("Taking you to sign in");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sign-in"));
  });

  it("renders owned workspaces with their real destination and lifecycle actions", async () => {
    session.isSignedIn = true;
    api.getWorkspaces.mockResolvedValue([{ id: "workspace-1", name: "Reliable notification platform", status: "ACTIVE", source: "CUSTOM", progressPercent: 38 }]);
    renderWithProviders(<PracticeHome />);
    expect(await screen.findByRole("link", { name: "Reliable notification platform" })).toHaveAttribute("href", "/workspace/workspace-1");
    expect(screen.getByRole("button", { name: "Rename" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();
  });

  it("creates a custom workspace through the backend", async () => {
    session.isSignedIn = true;
    api.getWorkspaces.mockResolvedValue([]);
    api.createWorkspace.mockResolvedValue({ id: "workspace-2" });
    renderWithProviders(<PracticeHome />);
    await screen.findByRole("heading", { name: "Start a custom design" });
    fireEvent.change(screen.getByLabelText("System name"), { target: { value: "Orders" } });
    fireEvent.change(screen.getByLabelText("What are you designing?"), { target: { value: "A reliable ordering system" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Workspace" }));
    await waitFor(() => expect(api.createWorkspace).toHaveBeenCalledWith("Orders", "A reliable ordering system"));
    expect(router.push).toHaveBeenCalledWith("/workspace/workspace-2");
  });
});
