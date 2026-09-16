import type { NextConfig } from "next";

// A static export: `next build` writes the site to `out/`, which any
// file host serves.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // The painter reads the grammars and the oniguruma wasm from disk at
  // build time. Node loads them; the bundler must not.
  serverExternalPackages: ["vscode-oniguruma", "vscode-textmate"],
};

export default nextConfig;
