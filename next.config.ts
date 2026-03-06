import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/best-restaurant',
  images: { unoptimized: true },
};

export default nextConfig;
