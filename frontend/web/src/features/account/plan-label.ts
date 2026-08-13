import type { CurrentEntitlements } from "@/lib/api/authenticated-client";

export type UsageLoadState = "loading" | "ready" | "error";

export function isProPlan(usage: CurrentEntitlements | null) {
  return usage?.plan === "PRO";
}

export function planLabel(usage: CurrentEntitlements | null, state: UsageLoadState) {
  if (state === "loading") return "Plan loading";
  if (state === "error" || !usage) return "Plan unavailable";
  return isProPlan(usage) ? "Pro" : "Free personal beta";
}

export function planBadge(usage: CurrentEntitlements | null, state: UsageLoadState) {
  if (state === "loading") return "PLAN LOADING";
  if (state === "error" || !usage) return "PLAN UNAVAILABLE";
  return isProPlan(usage) ? "PRO" : "FREE · PERSONAL BETA";
}
