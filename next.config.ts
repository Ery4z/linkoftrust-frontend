import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // there are ESLint warnings or errors. Make sure you use this option carefully.
        ignoreDuringBuilds: true,
      },
};

export default nextConfig;
