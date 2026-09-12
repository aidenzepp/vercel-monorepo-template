import type { NextConfig } from "next";

/**
 * Keeps shared UI source transpiled with the authenticated product application.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig;
