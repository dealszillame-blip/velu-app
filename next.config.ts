import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/admin/nsw-builders": [
      "./scripts/data/nsw-sydney-builders.json.gz",
    ],
  },
};

export default nextConfig;
