import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // all pages are static; Cloudflare serves out/ as assets
};

export default nextConfig;
