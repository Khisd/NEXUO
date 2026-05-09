import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Biarkan build selesai meski ada warning kecil, tapi error fatal tetap dicegah
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;