/**
 * 结构化数据（schema.org JSON-LD），帮助搜索引擎理解站点是什么、能做什么。
 * 只写站点真实具备的信息：不编造评分、评论数等字段。
 */
import { SITE_URL } from '@/lib/site';

const SITE_NAME = '紫微命盘';
const DESCRIPTION = '基于倪海厦正宗紫微斗数体系的免费在线排盘：十四主星、四化飞星、格局识别、大限流年与 AI 解读。';

export function homeJsonLd(siteUrl: string = SITE_URL) {
  const website = `${siteUrl}/#website`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': website,
        url: `${siteUrl}/`,
        name: SITE_NAME,
        // 知识库文章的 publisher 与 og:site_name 用的是这个名字
        alternateName: '紫微研究',
        description: DESCRIPTION,
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}/#app`,
        name: '紫微斗数在线排盘',
        url: `${siteUrl}/chart`,
        description: DESCRIPTION,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        inLanguage: 'zh-CN',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
        featureList: [
          '倪海厦体系排盘：纳音五行局起盘，十四主星与四化飞星',
          '自动识别命盘格局',
          '大限、流年运势',
          'AI 命盘解读与追问',
          '紫微合盘',
        ],
        isPartOf: { '@id': website },
      },
    ],
  };
}

/** 输出 <script type="application/ld+json">；转义 <，避免内容里的 </script> 提前结束标签。 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
