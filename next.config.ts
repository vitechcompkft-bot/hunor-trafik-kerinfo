import type { NextConfig } from "next";

// Vercel deploy - nincs basePath, dinamikus SSR is működhet
const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;
