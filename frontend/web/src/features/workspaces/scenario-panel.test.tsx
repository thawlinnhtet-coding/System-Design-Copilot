import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ScenarioPanel } from "./scenario-panel";

const api = vi.hoisted(() => ({ getScenarios: vi.fn(), startScenario: vi.fn(), saveScenarioDraft: vi.fn(), completeScenario: vi.fn(), createAiAssistedScenario: vi.fn() }));
vi.mock("@/lib/api/authenticated-client", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/api/authenticated-client")>()), useAuthenticatedApiClient: () => api }));

const available = { id: "scenario-1", source: "CURATED", orderIndex: 0, title: "Viral redirect traffic", changedCondition: "Redirect traffic rises 20x.", details: "What changes first?", category: "GROWTH_SCALE", status: "AVAILABLE" } as const;
const revealed = { ...available, status: "REVEALED" } as const;

describe("ScenarioPanel", () => {
	beforeEach(() => { vi.clearAllMocks(); api.getScenarios.mockResolvedValue([available]); });

	it("reveals, saves, and completes a user-started Scenario response", async () => {
		api.startScenario.mockResolvedValue(revealed);
		api.saveScenarioDraft.mockResolvedValue({ ...revealed, status: "DRAFT", response: "Separate hot reads from durable writes." });
		api.completeScenario.mockResolvedValue({ ...revealed, status: "COMPLETED", response: "Separate hot reads from durable writes." });
		renderWithProviders(<ScenarioPanel readOnly={false} workspaceId="workspace-1" />);
		expect(await screen.findByText("Choose when to begin.")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Start Scenario →" }));
		await screen.findByLabelText("Active Scenario");
		fireEvent.change(screen.getByLabelText("What changes, and why?"), { target: { value: "Separate hot reads from durable writes." } });
		fireEvent.click(screen.getByRole("button", { name: "Save response" }));
		await waitFor(() => expect(api.saveScenarioDraft).toHaveBeenCalledWith("workspace-1", "scenario-1", expect.objectContaining({ response: "Separate hot reads from durable writes." })));
		fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
		await waitFor(() => expect(api.completeScenario).toHaveBeenCalled());
		expect(await screen.findByText("Response included in later Review context.")).toBeInTheDocument();
	});

	it("explains AI consent when AI-assisted Scenario creation is blocked", async () => {
		api.getScenarios.mockResolvedValue([]);
		api.createAiAssistedScenario.mockRejectedValue({ name: "ApiRequestError", status: 428, details: { code: "ai_consent_required" } });
		renderWithProviders(<ScenarioPanel readOnly={false} workspaceId="workspace-1" />);
		fireEvent.click(await screen.findByRole("button", { name: "Create AI-assisted Scenario" }));
		expect(await screen.findByText("AI Processing Consent is required before an AI-assisted Scenario can be shown.")).toBeInTheDocument();
	});
});
