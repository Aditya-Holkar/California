// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  },
  // Optional: Add other configuration options as needed
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
