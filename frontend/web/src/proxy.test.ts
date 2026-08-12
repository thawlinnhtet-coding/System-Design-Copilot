import { describe, expect, it } from "vitest";
import { isProtectedAppPath } from "./proxy";

describe("protected application routes", () => {
  it("protects Practice and private workspace surfaces", () => {
    expect(isProtectedAppPath("/practice")).toBe(true);
    expect(isProtectedAppPath("/workspace/ws-1")).toBe(true);
    expect(isProtectedAppPath("/account/profile")).toBe(true);
    expect(isProtectedAppPath("/data")).toBe(true);
  });

  it("leaves public landing, auth, pricing, and challenge pages reachable", () => {
    expect(isProtectedAppPath("/")).toBe(false);
    expect(isProtectedAppPath("/sign-in")).toBe(false);
    expect(isProtectedAppPath("/pricing")).toBe(false);
    expect(isProtectedAppPath("/challenges")).toBe(false);
  });
});
