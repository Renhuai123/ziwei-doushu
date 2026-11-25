/**
 * 全站安全响应头。没有加完整的 CSP：layout 里的内联主题脚本需要 nonce 或 hash 才能放行，另行处理。
 * frame-ancestors 只限制谁能把本站嵌进 iframe，不影响页面本身加载的资源。
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // 站点用不到这些能力；复制链接用的剪贴板不在此列
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  allowedDevOrigins: ['127.0.0.1'],
  agentRules: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
