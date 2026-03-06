import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Eliminate cross-origin dev warning for the server IP
  allowedDevOrigins: ['188.245.86.27'],

  // Enable React strict mode for catching bugs early (double-render in dev only)
  reactStrictMode: true,

  // Enable gzip/brotli compression at the Next.js level
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Disable x-powered-by header (minor security + fewer bytes)
  poweredByHeader: false,

  // Production source maps off — smaller bundles, faster load
  productionBrowserSourceMaps: false,

  // Experimental performance flags
  experimental: {
    // Enable optimized CSS (minification + dedup)
    optimizeCss: true,
  },
};

export default nextConfig;
