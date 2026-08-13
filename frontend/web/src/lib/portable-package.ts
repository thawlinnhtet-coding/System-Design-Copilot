export const portablePackageFormat = "system-design-copilot" as const;
export const portablePackageSchemaVersion = 1 as const;
export const portablePackageMaxBytes = 1_048_576;

export type PortablePackage = {
  format: typeof portablePackageFormat;
  schemaVersion: typeof portablePackageSchemaVersion;
  workspace: {
    title: string;
    requirements: unknown[];
    assumptions: unknown[];
    decisions: unknown[];
    architecture: {
      nodes: unknown[];
      edges: unknown[];
      groups: unknown[];
      viewport: Record<string, unknown>;
    };
  };
};

const forbiddenKeys = new Set(["ownerId", "userId", "plan", "billing", "usage", "reviews", "provider", "audit"]);

export function validatePortablePackage(value: unknown): { package?: PortablePackage; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) return { errors: ["The file must contain a JSON object."] };
  if (value.format !== portablePackageFormat) errors.push('format must be "system-design-copilot".');
  if (value.schemaVersion !== portablePackageSchemaVersion) errors.push("schemaVersion must be 1, the only supported import version.");
  if (!isRecord(value.workspace)) {
    errors.push("workspace must be an object.");
  } else {
    if (typeof value.workspace.title !== "string" || !value.workspace.title.trim()) errors.push("workspace.title is required.");
    for (const field of ["requirements", "assumptions", "decisions"]) if (!Array.isArray(value.workspace[field])) errors.push(`workspace.${field} must be an array.`);
    if (!isRecord(value.workspace.architecture)) errors.push("workspace.architecture is required.");
    else for (const field of ["nodes", "edges", "groups"]) if (!Array.isArray(value.workspace.architecture[field])) errors.push(`workspace.architecture.${field} must be an array.`);
  }
  const forbidden = findForbiddenKey(value);
  if (forbidden) errors.push(`The file contains server-owned field "${forbidden}". Remove it before importing.`);
  if (JSON.stringify(value).match(/<script|javascript:/i)) errors.push("The file contains unsafe text content.");
  return errors.length ? { errors } : { package: value as PortablePackage, errors: [] };
}

export function packageBytes(value: unknown) { return new TextEncoder().encode(JSON.stringify(value, null, 2)).byteLength; }

export function downloadPortablePackage(value: PortablePackage, filename = "system-design-copilot-export.json") {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function findForbiddenKey(value: unknown): string | null { if (Array.isArray(value)) for (const item of value) { const found = findForbiddenKey(item); if (found) return found; } else if (isRecord(value)) for (const [key, child] of Object.entries(value)) { if (forbiddenKeys.has(key)) return key; const found = findForbiddenKey(child); if (found) return found; } return null; }
