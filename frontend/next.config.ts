import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" — disabled: Turbopack (Next 16.x) doesn't generate
  // standalone output correctly. Re-enable when standalone build is verified.
  // When re-enabled, update PM2 and Dockerfile to use node .next/standalone/server.js
};

export default nextConfig;
