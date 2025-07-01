import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
  typescript: {
    // Skip TypeScript checking during build (tests have their own checking)
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't run ESLint on test files during build
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib'].filter(dir => !dir.includes('__tests__')),
  },
};

export default nextConfig;
