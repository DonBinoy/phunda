import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Avoid Turbopack scanning the API server folder
  outputFileTracingExcludes: {
    "*": ["./server/**/*"],
  },
};

export default nextConfig;
