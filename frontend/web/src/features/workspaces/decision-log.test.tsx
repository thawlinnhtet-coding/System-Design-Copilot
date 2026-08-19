import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { DecisionLog } from "./decision-log";

const api = vi.hoisted(() => ({
  getReasoning: vi.fn(),
  createDecision: vi.fn(),
  updateDecision: vi.fn(),
  deleteDecision: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/authenticated-client")>("@/lib/api/authenticated-client");
  return { ...actual, useAuthenticatedApiClient: () => api };
});

describe("DecisionLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getReasoning.mockResolvedValue({ requirements: [], assumptions: [], questions: [], decisions: [], reviewBrief: null });
    api.createDecision.mockResolvedValue({ id: "decision-1" });
  });

  it("renders an empty Decision Log with an add form", async () => {
    renderWithProviders(<DecisionLog workspaceId="workspace-1" />);

    expect(await screen.findByText("Record the choices and trade-offs.")).toBeVisible();
    expect(screen.getByText("No Decisions yet. Record the first architectural choice and its trade-off.")).toBeVisible();
  });

  it("lists existing decisions", async () => {
    api.getReasoning.mockResolvedValue({ requirements: [], assumptions: [], questions: [], decisions: [{ id: "decision-1", title: "Use a queue", chosenOption: "Durable queue", rationale: "Decouples ingestion.", status: "ACCEPTED" }], reviewBrief: null });
    renderWithProviders(<DecisionLog workspaceId="workspace-1" />);

    expect(await screen.findByText("Use a queue")).toBeVisible();
  });

  it("records a new decision", async () => {
    renderWithProviders(<DecisionLog workspaceId="workspace-1" />);
    await screen.findByText("Record the choices and trade-offs.");

    fireEvent.change(screen.getByRole("textbox", { name: "Decision title" }), { target: { value: "Cache reads" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Chosen option" }), { target: { value: "Redis cache" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Decision rationale" }), { target: { value: "Reduces database load." } });
    fireEvent.click(screen.getByRole("button", { name: "Record Decision" }));

    await waitFor(() => expect(api.createDecision).toHaveBeenCalledWith("workspace-1", expect.objectContaining({ title: "Cache reads", chosenOption: "Redis cache", rationale: "Reduces database load." })));
  });
});
