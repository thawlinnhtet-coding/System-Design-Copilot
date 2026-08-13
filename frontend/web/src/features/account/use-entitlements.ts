"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";

export const entitlementsQueryKey = ["current-entitlements"] as const;

export function useEntitlements() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();

  return useQuery({
    queryKey: entitlementsQueryKey,
    queryFn: api.getUsage,
    enabled: isLoaded && isSignedIn,
  });
}
