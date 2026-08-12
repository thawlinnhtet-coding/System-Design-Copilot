import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/practice",
  "/workspace",
  "/account",
  "/data",
  "/progress",
  "/dashboard",
  "/billing",
] as const;

export function isProtectedAppPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

const clerkProxy = process.env.CLERK_SECRET_KEY
  ? clerkMiddleware(async (auth, request) => {
      if (!isProtectedAppPath(request.nextUrl.pathname)) {
        return;
      }

      const { isAuthenticated } = await auth();
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    })
  : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkProxy) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return clerkProxy(request, event);
}

export const config = {
  matcher: [
    "/practice(.*)",
    "/workspace(.*)",
    "/account(.*)",
    "/data(.*)",
    "/progress(.*)",
    "/dashboard(.*)",
    "/billing(.*)",
  ],
};
