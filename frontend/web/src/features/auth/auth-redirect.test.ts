import { describe, expect, it } from "vitest";
import { getAuthDestination, withAuthDestination } from "./auth-redirect";

function searchParams(value: string) {
  return new URLSearchParams(value);
}

describe("auth redirect destination", () => {
  it("returns users to Practice when no destination is supplied", () => {
    expect(getAuthDestination(searchParams(""))).toBe("/practice");
  });

  it("preserves a same-origin destination through the auth flow", () => {
    const destination = getAuthDestination(searchParams("returnTo=%2Fchallenges%3Fchallenge%3Dqueue"));

    expect(destination).toBe("/challenges?challenge=queue");
    expect(withAuthDestination("/sign-in/sso-callback", destination)).toBe("/sign-in/sso-callback?returnTo=%2Fchallenges%3Fchallenge%3Dqueue");
  });

  it("rejects external and auth-loop destinations", () => {
    expect(getAuthDestination(searchParams("returnTo=https%3A%2F%2Fevil.example%2Fsteal"))).toBe("/practice");
    expect(getAuthDestination(searchParams("returnTo=%2Fsign-in%3FreturnTo%3D%2Fdashboard"))).toBe("/practice");
  });
});
