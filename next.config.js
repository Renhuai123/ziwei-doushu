/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  allowedDevOrigins: ['127.0.0.1'],
  agentRules: false,
};

module.exports = nextConfig;
