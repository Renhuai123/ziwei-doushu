/**
 * /knowledge/[star]/[topic] — trang tri thức theo chủ đề
 *
 * Server component giữ metadata + JSON-LD (tiếng Việt, ngôn ngữ mặc định);
 * phần nội dung hiển thị nằm trong KnowledgeArticle để dùng useLanguage().
 */

import { notFound } from 'next/navigation';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import { getAllKnowledgeRoutes, getKnowledge, SLUG_TO_STAR } from '@/lib/seo/knowledge';
import { SITE_URL } from '@/lib/site';
import vi from '@/messages/vi.json';
import KnowledgeArticle from './KnowledgeArticle';

// 允许动态参数：如果某个 star/topic 组合不在 generateStaticParams 列表中
// 也允许运行时按需渲染，避免中文 URL 编码问题导致 404
export const dynamicParams = false;

const VI_STARS = vi.knowledge.starNames as Record<string, string>;
const VI_TOPICS = vi.knowledge.topics as Record<string, string>;
const VI_PALACES = vi.knowledge.palaces as Record<string, string>;

export async function generateStaticParams() {
  const routes = getAllKnowledgeRoutes();
  // URL 用拼音 slug 替代中文，避开 Vercel/CDN 中文路由边界问题
  return routes.map(r => ({ star: r.slug, topic: r.topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) return {};
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) return {};

  const starName = VI_STARS[slug] ?? star;
  const palace = VI_PALACES[topic] ?? topic;
  const topicLabel = VI_TOPICS[topic] ?? topic;
  const title = `${starName} nhập ${palace} cung · ${topicLabel} · Hệ Nghê Hải Hạ`;
  const description =
    data.parsed.dingdiao ||
    `${starName} nhập ${palace} cung trong Tử Vi Đẩu Số — biên soạn theo hệ Thiên Kỷ của Nghê Hải Hạ và cổ tịch Tử Vi Đẩu Số Toàn Tập, Cốt Tủy Phú.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/knowledge/${slug}/${topic}`,
    },
    alternates: {
      canonical: `${SITE_URL}/knowledge/${slug}/${topic}`,
    },
    keywords: [
      'tử vi đẩu số', 'tử vi', starName, palace, topicLabel,
      `${starName} ${palace}`, `${starName} nhập ${palace} cung`,
      `tử vi ${starName}`, 'nghê hải hạ', 'tử vi đẩu số toàn tập',
    ],
  };
}

export default async function KnowledgePage({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) notFound();
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) notFound();

  const starName = VI_STARS[slug] ?? star;
  const palace = VI_PALACES[topic] ?? topic;
  const topicLabel = VI_TOPICS[topic] ?? topic;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${starName} nhập ${palace} cung · ${topicLabel}`,
    description: data.parsed.dingdiao,
    inLanguage: 'vi',
    author: { '@type': 'Organization', name: 'Tử Vi nghiên cứu' },
    publisher: {
      '@type': 'Organization',
      name: 'Tử Vi nghiên cứu',
      url: SITE_URL,
    },
    datePublished: '2026-04-28',
    dateModified: '2026-11-07',
    mainEntityOfPage: `${SITE_URL}/knowledge/${slug}/${topic}`,
    articleSection: 'Tử Vi Đẩu Số · Hệ Nghê Hải Hạ',
    keywords: ['tử vi đẩu số', starName, palace, topicLabel].join(', '),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <KnowledgeArticle slug={slug} topic={topic} />
    </>
  );
}
