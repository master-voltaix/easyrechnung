/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["puppeteer"],
  },
  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;
