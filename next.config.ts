import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000', 'neon.lamyn.tech'],
};

export default nextConfig;
