import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { PortableData } from "./portable-data";

const api = vi.hoisted(() => ({
  validatePortableImport: vi.fn(),
  importPortablePackage: vi.fn(),
}));
const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@/lib/api/authenticated-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(public status: number, public details?: Record<string, unknown>) { super(); }
  },
  useAuthenticatedApiClient: () => api,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const packageNode = {
  format: "system-design-copilot",
  schemaVersion: 1,
  workspace: {
    title: "Imported design",
    requirements: [],
    assumptions: [],
    decisions: [],
    architecture: { schemaVersion: 1, components: [], connections: [], boundaries: [] },
  },
};

describe("PortableData", () => {
  beforeEach(() => vi.clearAllMocks());

  it("previews, server-validates, and creates an imported Workspace with a Review Brief", async () => {
    api.validatePortableImport.mockResolvedValue({ packageNode, preview: { title: "Imported design", bytes: 220 } });
    api.importPortablePackage.mockResolvedValue({ id: "workspace-imported" });
    renderWithProviders(<PortableData />);

    const file = new File([JSON.stringify(packageNode)], "design.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Choose JSON package"), { target: { files: [file] } });

    expect(await screen.findByText("Package validated by the server")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Imported system description"), { target: { value: "An existing system" } });
    fireEvent.change(screen.getByLabelText("Imported review goal"), { target: { value: "Check reliability" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Architecture Review Workspace" }));

    await waitFor(() => expect(api.importPortablePackage).toHaveBeenCalledWith("Imported design", "An existing system", "Check reliability", packageNode));
    expect(router.push).toHaveBeenCalledWith("/workspace/workspace-imported");
  });
});
