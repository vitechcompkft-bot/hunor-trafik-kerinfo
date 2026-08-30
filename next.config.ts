import type { NextConfig } from "next";

// GitHub Pages alá kerül a repo-név prefixszel
const isProd = process.env.NODE_ENV === "production";
const repo = "hunor-trafik-kerinfo";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
};

export default nextConfig;
