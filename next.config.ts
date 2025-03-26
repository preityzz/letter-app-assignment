import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
   
    config.resolve.alias = {
      ...config.resolve.alias,
      process: "process/browser",
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, 
      path: false, 
    };

    return config;
  },
};

export default nextConfig;
