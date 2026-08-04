import type { NextConfig } from "next";

function origin(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return new URL(value).origin;
}

const apiOrigin = origin(process.env.NEXT_PUBLIC_API_BASE_URL);
const clerkOrigin = origin(process.env.NEXT_PUBLIC_CLERK_FRONTEND_API);
const connectSources = ["'self'", apiOrigin, clerkOrigin].filter(Boolean).join(" ");
const clerkSources = clerkOrigin ? ` ${clerkOrigin}` : "";
const developmentEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `script-src 'self' 'unsafe-inline'${developmentEval}${clerkSources}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  `img-src 'self' data:${clerkSources}`,
  `connect-src ${connectSources}`,
  `frame-src${clerkSources || " 'none'"}`,
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
