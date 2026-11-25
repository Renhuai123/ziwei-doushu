// ESLint 9 flat config。Next 16 起不再有 `next lint`，直接跑 `npm run lint`（eslint .）。
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      '.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts',
      // 研究目录、数据与文档不属于站点代码
      'research/**', 'docs/**', 'data/**', 'public/**',
    ],
  },
];

export default config;
