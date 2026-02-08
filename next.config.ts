import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double effect execution (duplicate API calls)
  reactStrictMode: false,
};

export default nextConfig;
