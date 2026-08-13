const DEFAULT_AUTH_DESTINATION = "/practice";

type SearchParamsLike = { get(name: string): string | null };

export function getAuthDestination(searchParams: SearchParamsLike) {
  const requested = searchParams.get("returnTo") ?? searchParams.get("redirect_url");
  if (!requested) return DEFAULT_AUTH_DESTINATION;

  try {
    const url = new URL(requested, "http://system-design-copilot.local");
    if (url.origin !== "http://system-design-copilot.local") return DEFAULT_AUTH_DESTINATION;
    if (url.pathname.startsWith("/sign-in") || url.pathname.startsWith("/sign-up")) return DEFAULT_AUTH_DESTINATION;
    return `${url.pathname}${url.search}` || "/";
  } catch {
    return DEFAULT_AUTH_DESTINATION;
  }
}

export function withAuthDestination(path: string, destination: string) {
  if (destination === DEFAULT_AUTH_DESTINATION) return path;
  return `${path}${path.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(destination)}`;
}
