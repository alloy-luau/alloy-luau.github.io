import type { NextConfig } from "next";

// A static export: `next build` writes the site to `out/`, which any
// file host serves.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
