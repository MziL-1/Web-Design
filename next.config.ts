import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
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
