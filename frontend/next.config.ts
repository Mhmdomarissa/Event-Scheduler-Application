import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "event-scheduler-application-production.up.railway.app" },
    ],
  },
};

export default nextConfig;
