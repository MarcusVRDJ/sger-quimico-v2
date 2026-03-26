import type { NextConfig } from "next";

function resolveAllowedOrigins(): string[] {
  const fromEnv = process.env.NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      return [url.host];
    } catch {
      // Fall back to localhost when NEXT_PUBLIC_APP_URL is invalid.
    }
  }

  return ["localhost:3000"];
}

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: resolveAllowedOrigins(),
    },
  },
};

export default nextConfig;
