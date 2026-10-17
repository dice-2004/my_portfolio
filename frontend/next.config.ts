import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番イメージ（docker/Dockerfile.frontend）では .next/standalone だけを node で動かす
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? "http://backend:8080"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
