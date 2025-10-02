const allowedDevOrigins = [];
for (let i = 1; i < 256; i++) {
  allowedDevOrigins.push(`192.168.1.${i}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  allowedDevOrigins,
};

module.exports = nextConfig;
