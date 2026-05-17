import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    optimizePackageImports: [
      "react-markdown",
      "remark-gfm",
      "rehype-raw",
      "next-auth",
      "@milkdown/kit",
      "@milkdown/react",
    ],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /prisma/,
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {},
  },
};

export default nextConfig;
