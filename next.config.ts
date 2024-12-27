import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  i18n: {
    locales: ["ja"],
    defaultLocale: "ja",
    localeDetection: false,
  },
};

export default nextConfig;
