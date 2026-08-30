import type { NextConfig } from "next";

// Vercel deploy - nincs basePath, dinamikus SSR is működhet
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_APP_VERSION: "1.2.3",
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
