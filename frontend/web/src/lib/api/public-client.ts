import type { components } from "./generated";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
export type ChallengeSummary = Required<components["schemas"]["ChallengeSummary"]>;

export async function getChallenges(): Promise<ChallengeSummary[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/challenges`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Challenge catalog request failed with status ${response.status}`);
  }
  return response.json() as Promise<ChallengeSummary[]>;
}
