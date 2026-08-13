import type { NextConfig } from "next";

function origin(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return new URL(value).origin;
}

function clerkOriginFromPublishableKey(key: string | undefined) {
  if (!key) {
    return undefined;
  }

  const encoded = key.slice(key.lastIndexOf("_") + 1);
  const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
  const decoded = Buffer.from(padded, "base64").toString("utf-8");
  const frontendApi = decoded.replace(/\$$/, "");

  return `https://${frontendApi}`;
}

const apiOrigin = origin(process.env.NEXT_PUBLIC_API_BASE_URL);
const clerkOrigin = clerkOriginFromPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const clerkImageOrigin = "https://img.clerk.com";
const turnstileOrigin = "https://challenges.cloudflare.com";
const connectSources = ["'self'", apiOrigin, clerkOrigin].filter(Boolean).join(" ");
const clerkSources = clerkOrigin ? ` ${clerkOrigin}` : "";
const turnstileSources = ` ${turnstileOrigin}`;
const developmentEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `script-src 'self' 'unsafe-inline'${developmentEval}${clerkSources}${turnstileSources}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  `img-src 'self' data:${clerkSources} ${clerkImageOrigin}`,
  "worker-src 'self' blob:",
  `connect-src ${connectSources}${turnstileSources}`,
  `frame-src${clerkSources}${turnstileSources}`,
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
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
