import type { NextConfig } from "next";

/**
 * Keeps shared UI source transpiled with the public marketing application.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig;
