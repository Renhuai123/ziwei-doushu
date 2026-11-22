/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  // /api/interpret đọc lúc chạy: nguyên văn Nghê Hải Hạ (lib/ai/knowledge.ts) và dataset v4 đã tải (lib/ai/dataset-v4.ts)
  outputFileTracingIncludes: {
    '/api/interpret': ['./docs/tianji-ziwei/entries.jsonl', './data/dataset-v4/*.jsonl.zst'],
  },
};

module.exports = nextConfig;
