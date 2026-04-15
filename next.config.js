/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@stellar/stellar-sdk", "sodium-native"]
};

module.exports = nextConfig;
