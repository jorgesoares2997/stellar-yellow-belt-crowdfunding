/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@stellar/stellar-sdk", "sodium-native"]
  }
};

module.exports = nextConfig;
