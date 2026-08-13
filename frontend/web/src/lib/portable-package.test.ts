import { describe, expect, it } from "vitest";
import { packageBytes, portablePackageMaxBytes, validatePortablePackage } from "./portable-package";

const validPackage = {
  format: "system-design-copilot",
  schemaVersion: 1,
  workspace: {
    title: "Event ingestion",
    requirements: [],
    assumptions: [],
    decisions: [],
    architecture: { nodes: [], edges: [], groups: [], viewport: {} },
  },
};

describe("portable package validation", () => {
  it("accepts the documented package shape", () => {
    expect(validatePortablePackage(validPackage)).toEqual({ package: validPackage, errors: [] });
  });

  it("reports actionable format and server-owned field errors", () => {
    const result = validatePortablePackage({ ...validPackage, format: "other", workspace: { ...validPackage.workspace, billing: { plan: "PRO" } } });

    expect(result.package).toBeUndefined();
    expect(result.errors).toEqual(expect.arrayContaining([
      'format must be "system-design-copilot".',
      'The file contains server-owned field "billing". Remove it before importing.',
    ]));
  });

  it("keeps the browser limit explicit", () => {
    expect(portablePackageMaxBytes).toBe(1_048_576);
    expect(packageBytes(validPackage)).toBeLessThan(portablePackageMaxBytes);
  });
});
