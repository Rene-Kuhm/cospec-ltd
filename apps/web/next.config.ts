import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@cospec/shared-types', '@cospec/shared-utils'],
  experimental: {
    // Enable server actions (Next.js 15)
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

export default nextConfig;
