"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import type { components } from "./generated";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const tokenTemplate = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE ?? "system-design-copilot-api";
type CurrentUserResponse = components["schemas"]["CurrentUserResponse"];
export type WorkspaceSummary = components["schemas"]["WorkspaceSummary"];
export type ChallengeDetail = Omit<Required<components["schemas"]["ChallengeDetail"]>, "skillCoverage"> & {
  skillCoverage: Array<Required<components["schemas"]["SkillCoverage"]>>;
};
export type WorkspaceType = NonNullable<WorkspaceSummary["type"]>;
export type WorkspaceSource = NonNullable<WorkspaceSummary["source"]>;
export type CurrentEntitlements = components["schemas"]["CurrentEntitlements"];
export type AiConsent = components["schemas"]["AiConsentResponse"];
export type Requirement = components["schemas"]["RequirementResponse"];
export type Assumption = components["schemas"]["AssumptionResponse"];
export type UnresolvedQuestion = components["schemas"]["QuestionResponse"];
export type Decision = components["schemas"]["DecisionResponse"];
export type ReviewBrief = components["schemas"]["ReviewBriefResponse"];
export type RequirementInput = components["schemas"]["RequirementRequest"];
export type AssumptionInput = components["schemas"]["AssumptionRequest"];
export type QuestionInput = components["schemas"]["QuestionRequest"];
export type DecisionInput = components["schemas"]["DecisionRequest"];
export type WorkspaceReasoning = {
  requirements: NonNullable<components["schemas"]["ReasoningResponse"]["requirements"]>;
  assumptions: NonNullable<components["schemas"]["ReasoningResponse"]["assumptions"]>;
  questions: NonNullable<components["schemas"]["ReasoningResponse"]["questions"]>;
  decisions: NonNullable<components["schemas"]["ReasoningResponse"]["decisions"]>;
  reviewBrief?: ReviewBrief | null;
};

export type ArchitectureComponentCategory = "COMPUTE" | "DATA_STORE" | "MESSAGING" | "EDGE_SECURITY" | "IDENTITY_SECRETS" | "OBSERVABILITY" | "CUSTOM";
export type ArchitectureComponentType = "SERVICE" | "FUNCTION" | "BATCH_JOB" | "RELATIONAL_DATABASE" | "DOCUMENT_DATABASE" | "CACHE" | "OBJECT_STORE" | "QUEUE" | "STREAM" | "GATEWAY" | "LOAD_BALANCER" | "WAF" | "IDENTITY_PROVIDER" | "SECRETS_MANAGER" | "LOGGING" | "METRICS" | "TRACING" | "EXTERNAL_API" | "CUSTOM_COMPONENT";
export type ArchitectureDocument = {
  schemaVersion: 1;
  components: Array<{
    id: string;
    category: ArchitectureComponentCategory;
    type: ArchitectureComponentType;
    label: string;
    properties: Record<string, string | number | boolean>;
    metadata?: Record<string, string | number | boolean>;
    position?: { x: number; y: number };
    boundaryId?: string;
  }>;
  connections: Array<{
    id: string;
    fromComponentId: string;
    toComponentId: string;
    intent: string;
    protocol?: string;
    guarantee?: string;
    notes?: string;
    metadata?: Record<string, string | number | boolean>;
  }>;
  boundaries: Array<Record<string, unknown>>;
};
export type ArchitectureDocumentResponse = { workspaceId: string; version: number; document: ArchitectureDocument; updatedAt?: string };
export type ArchitectureRevisionResponse = { id: string; workspaceId: string; documentVersion: number; document: ArchitectureDocument; reasoningContext: unknown; createdAt?: string };

export class ApiRequestError extends Error {
  constructor(public readonly status: number, public readonly details?: Record<string, unknown>) {
    super(`API request failed with status ${status}`);
    this.name = "ApiRequestError";
  }
}

export function useAuthenticatedApiClient() {
  const { getToken } = useAuth();

  return useMemo(() => {
    async function request(path: string, init: RequestInit = {}) {
      const token = await getToken({ template: tokenTemplate });
      if (!token) {
        throw new Error("No active Clerk session is available for this request");
      }

      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${token}`);
      headers.set("Accept", "application/json");

      return fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers,
      });
    }

    async function json<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await request(path, init);
      if (!response.ok) {
        let details: Record<string, unknown> | undefined;
        try { details = await response.json() as Record<string, unknown>; } catch { /* response may be empty */ }
        throw new ApiRequestError(response.status, details);
      }

      return response.json() as Promise<T>;
    }

    async function deleteRequest(path: string) {
      const response = await request(path, { method: "DELETE" });
      if (!response.ok) {
        throw new ApiRequestError(response.status);
      }
    }

    return {
      getCurrentUser(): Promise<CurrentUserResponse> {
        return json<CurrentUserResponse>("/api/v1/me");
      },
      getWorkspaces(): Promise<WorkspaceSummary[]> {
        return json<WorkspaceSummary[]>("/api/v1/workspaces");
      },
      getWorkspace(id: string): Promise<WorkspaceSummary> {
        return json<WorkspaceSummary>(`/api/v1/workspaces/${id}`);
      },
      getChallenge(slug: string): Promise<ChallengeDetail> {
        return json<ChallengeDetail>(`/api/v1/challenges/${encodeURIComponent(slug)}`);
      },
      startChallenge(slug: string): Promise<WorkspaceSummary> {
        return json<WorkspaceSummary>(`/api/v1/challenges/${encodeURIComponent(slug)}/workspaces`, { method: "POST" });
      },
      createWorkspace(name: string, description: string, type: WorkspaceType, source: WorkspaceSource): Promise<WorkspaceSummary> {
        return json<WorkspaceSummary>("/api/v1/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, type, source }),
        });
      },
      renameWorkspace(id: string, name: string): Promise<WorkspaceSummary> {
        return json<WorkspaceSummary>(`/api/v1/workspaces/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      },
      archiveWorkspace(id: string): Promise<WorkspaceSummary> {
        return json<WorkspaceSummary>(`/api/v1/workspaces/${id}/archive`, { method: "POST" });
      },
      restoreWorkspace(id: string): Promise<WorkspaceSummary> {
        return json<WorkspaceSummary>(`/api/v1/workspaces/${id}/restore`, { method: "POST" });
      },
      async deleteWorkspace(id: string): Promise<void> {
        const response = await request(`/api/v1/workspaces/${id}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
      },
      getReasoning(id: string): Promise<WorkspaceReasoning> {
        return json<WorkspaceReasoning>(`/api/v1/workspaces/${id}/reasoning`);
      },
      createRequirement(id: string, body: RequirementInput): Promise<Requirement> {
        return json<Requirement>(`/api/v1/workspaces/${id}/reasoning/requirements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      updateRequirement(workspaceId: string, id: string, body: RequirementInput): Promise<Requirement> {
        return json<Requirement>(`/api/v1/workspaces/${workspaceId}/reasoning/requirements/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      async deleteRequirement(workspaceId: string, id: string): Promise<void> {
        await deleteRequest(`/api/v1/workspaces/${workspaceId}/reasoning/requirements/${id}`);
      },
      createAssumption(id: string, body: AssumptionInput): Promise<Assumption> {
        return json<Assumption>(`/api/v1/workspaces/${id}/reasoning/assumptions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      updateAssumption(workspaceId: string, id: string, body: AssumptionInput): Promise<Assumption> {
        return json<Assumption>(`/api/v1/workspaces/${workspaceId}/reasoning/assumptions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      async deleteAssumption(workspaceId: string, id: string): Promise<void> {
        await deleteRequest(`/api/v1/workspaces/${workspaceId}/reasoning/assumptions/${id}`);
      },
      createQuestion(id: string, body: QuestionInput): Promise<UnresolvedQuestion> {
        return json<UnresolvedQuestion>(`/api/v1/workspaces/${id}/reasoning/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      updateQuestion(workspaceId: string, id: string, body: QuestionInput): Promise<UnresolvedQuestion> {
        return json<UnresolvedQuestion>(`/api/v1/workspaces/${workspaceId}/reasoning/questions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      async deleteQuestion(workspaceId: string, id: string): Promise<void> {
        await deleteRequest(`/api/v1/workspaces/${workspaceId}/reasoning/questions/${id}`);
      },
      createDecision(id: string, body: DecisionInput): Promise<Decision> {
        return json<Decision>(`/api/v1/workspaces/${id}/reasoning/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      updateDecision(workspaceId: string, id: string, body: DecisionInput): Promise<Decision> {
        return json<Decision>(`/api/v1/workspaces/${workspaceId}/reasoning/decisions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      async deleteDecision(workspaceId: string, id: string): Promise<void> {
        await deleteRequest(`/api/v1/workspaces/${workspaceId}/reasoning/decisions/${id}`);
      },
      saveReviewBrief(workspaceId: string, body: Omit<ReviewBrief, "workspaceId">): Promise<ReviewBrief> {
        return json<ReviewBrief>(`/api/v1/workspaces/${workspaceId}/reasoning/review-brief`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      },
      getArchitectureDocument(workspaceId: string): Promise<ArchitectureDocumentResponse> {
        return json<ArchitectureDocumentResponse>(`/api/v1/workspaces/${workspaceId}/architecture-document`);
      },
      saveArchitectureDocument(workspaceId: string, expectedVersion: number, document: ArchitectureDocument): Promise<ArchitectureDocumentResponse> {
        return json<ArchitectureDocumentResponse>(`/api/v1/workspaces/${workspaceId}/architecture-document`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedVersion, document }),
        });
      },
      createArchitectureRevision(workspaceId: string): Promise<ArchitectureRevisionResponse> {
        return json<ArchitectureRevisionResponse>(`/api/v1/workspaces/${workspaceId}/architecture-revisions`, { method: "POST" });
      },
      getUsage(): Promise<CurrentEntitlements> {
        return json<CurrentEntitlements>("/api/v1/me/usage");
      },
      getAiConsent(): Promise<AiConsent> {
        return json<AiConsent>("/api/v1/me/ai-consent");
      },
      grantAiConsent(policyVersion: string): Promise<AiConsent> {
        return json<AiConsent>("/api/v1/me/ai-consent", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ policyVersion }),
        });
      },
      withdrawAiConsent(): Promise<AiConsent> {
        return json<AiConsent>("/api/v1/me/ai-consent", { method: "DELETE" });
      },
      async reconcileCompletedCheckout(sessionId: string): Promise<void> {
        const response = await request(`/api/v1/billing/checkout/complete?session_id=${encodeURIComponent(sessionId)}`, { method: "POST" });
        if (!response.ok) {
          throw new ApiRequestError(response.status);
        }
      },
      async startCheckout(): Promise<string> {
        const response = await json<components["schemas"]["CheckoutSession"]>("/api/v1/billing/checkout", {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
        });
        return externalBillingUrl(response.url, "Checkout");
      },
      async openBillingPortal(): Promise<string> {
        const response = await json<components["schemas"]["PortalSession"]>("/api/v1/billing/portal", {
          method: "POST",
        });
        return externalBillingUrl(response.url, "Billing Portal");
      },
    };
  }, [getToken]);
}

function externalBillingUrl(value: string | undefined, destination: string) {
  if (!value) {
    throw new Error(`${destination} did not return a destination`);
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      throw new Error(`${destination} returned an unsafe destination`);
    }
    return url.toString();
  } catch {
    throw new Error(`${destination} returned an invalid destination`);
  }
}
