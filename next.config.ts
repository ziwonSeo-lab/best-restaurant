import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/best-restaurant',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: '/best-restaurant',
  },
};

export default nextConfig;
