import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a minimal, self-contained server bundle for the production Docker image.
  output: "standalone",
  reactStrictMode: true,
  // Prisma engine + node-rs argon2 are native and must not be bundled by the server build.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "@node-rs/argon2"],
  poweredByHeader: false,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/leaderboard",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
