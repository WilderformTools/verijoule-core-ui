import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["maplibre-gl", "@react-pdf/renderer"],
};

export default nextConfig;
