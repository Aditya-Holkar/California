import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Required for `next export` (static HTML)
  basePath: process.env.NODE_ENV === "production" ? "/California" : "", // For GitHub Pages subpath
  images: {
    unoptimized: true, // Disable Image Optimization API (static export doesn't support it)
  },
  // Optional: Add trailingSlash for better GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
