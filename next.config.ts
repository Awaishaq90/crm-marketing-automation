import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set the project root to avoid confusion with parent directory lockfiles
  experimental: {
    turbo: {
      root: process.cwd()
    }
  }
};

export default nextConfig;
