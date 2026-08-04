"use client";

import { useAuth } from "@clerk/nextjs";
import type { components } from "./generated";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const tokenTemplate = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE ?? "system-design-copilot-api";
type CurrentUserResponse = components["schemas"]["CurrentUserResponse"];

export function useAuthenticatedApiClient() {
  const { getToken } = useAuth();

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

  return {
    async getCurrentUser(): Promise<CurrentUserResponse> {
      const response = await request("/api/v1/me");
      if (!response.ok) {
        throw new Error(`Current user request failed with status ${response.status}`);
      }

      return response.json() as Promise<CurrentUserResponse>;
    },
  };
}
