import { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useAuthenticatedApiClient } from "./authenticated-client";

const getToken = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken }),
}));

function Probe() {
  const api = useAuthenticatedApiClient();

  useEffect(() => {
    void api.getAiConsent().then(() => undefined);
  }, [api]);

  return <p>Requesting account data</p>;
}

describe("authenticated API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    vi.clearAllMocks();
    getToken.mockResolvedValueOnce("stale-token").mockResolvedValueOnce("fresh-token");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "email_verification_required" }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ granted: false }), { status: 200 })));
  });

  it("refreshes the JWT once when email verification was completed after token caching", async () => {
    render(<Probe />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(getToken).toHaveBeenNthCalledWith(1, { template: "system-design-copilot-api" });
    expect(getToken).toHaveBeenNthCalledWith(2, { template: "system-design-copilot-api", skipCache: true });
  });
});
