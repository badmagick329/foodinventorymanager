/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  allowedDevOrigins: ["192.168.*"],
};

module.exports = nextConfig;
