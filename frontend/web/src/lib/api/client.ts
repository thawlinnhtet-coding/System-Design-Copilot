import "server-only";

import type { components } from "./generated";

export type HealthResponse = components["schemas"]["HealthResponse"];

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/health`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
