/**
 * /knowledge/[star]/[topic] — SEO 落地页
 *
 * 14 主星 × 13 topic = 182 个独立 URL
 * 每页含完整的 STAR_DB 4 段论断（一句话定调/核心论断/命盘依据/经典出处）
 *
 * SEO 要点：
 *  - title 含主关键词（如"紫微入命宫·倪海厦体系详解"）
 *  - description 用 dingdiao（一句话定调）
 *  - JSON-LD Article 结构化数据
 *  - 内链：同主星其他 12 宫 + 同宫其他 13 主星
 *  - generateStaticParams 静态生成，零运行时开销
 */

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { notFound } from 'next/navigation';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import {
  ALL_STARS,
  ALL_TOPICS,
  getKnowledge,
  getAllKnowledgeRoutes,
  STAR_BRIEF_SEO,
  STAR_TO_SLUG,
  SLUG_TO_STAR,
} from '@/lib/seo/knowledge';
import { SITE_URL } from '@/lib/site';

// 允许动态参数：如果某个 star/topic 组合不在 generateStaticParams 列表中
// 也允许运行时按需渲染，避免中文 URL 编码问题导致 404
export const dynamicParams = false;

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

  const title = `${star}入${data.palaceTitle} · ${data.topicLabel} · 倪海厦体系详解`;
  const description = data.parsed.dingdiao
    || `${star}入${data.palaceTitle}的紫微斗数解读 — 基于倪海厦《天纪》体系与古籍《紫微斗数全集》《骨髓赋》。`;

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
      '紫微斗数', '倪海厦', star, data.palaceName, data.topicLabel,
      `${star}${data.palaceName}`, `${star}入${data.palaceName}`,
      `紫微斗数 ${star}`, '倪海厦紫微斗数', '紫微斗数全集',
    ],
  };
}

export default async function KnowledgePage({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) notFound();
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) notFound();

  // 同 topic 其他主星
  const otherStarsForTopic = ALL_STARS.filter(s => s !== star && getKnowledge(s, topic as TopicKey).exists);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${star}入${data.palaceTitle} · ${data.topicLabel}`,
    description: data.parsed.dingdiao,
    author: { '@type': 'Organization', name: '紫微研究 · 倪海厦正宗' },
    publisher: {
      '@type': 'Organization',
      name: '紫微研究',
      url: SITE_URL,
    },
    datePublished: '2026-04-28',
    dateModified: '2026-04-28',
    mainEntityOfPage: `${SITE_URL}/knowledge/${slug}/${topic}`,
    articleSection: '紫微斗数 · 倪海厦体系',
    keywords: [`紫微斗数`, star, data.palaceName, data.topicLabel].join(', '),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 pb-24 pt-8 sm:pt-10">
        <nav aria-label="面包屑" className="mb-8 flex flex-wrap items-center gap-x-2 text-[13px]" style={{ color: 'var(--tx-3)' }}>
          <Link href="/knowledge" className="hover:text-[var(--tx-0)]">星曜知识</Link>
          <span aria-hidden>/</span>
          <Link href={`/knowledge/${slug}/overview`} className="hover:text-[var(--tx-0)]">{star}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page" style={{ color: 'var(--tx-1)' }}>{data.palaceTitle} · {data.topicLabel}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-14">
          <article className="min-w-0">
            <header className="mb-10">
              <p className="eyebrow mb-3">{data.topicLabel}</p>
              <h1
                className="text-[30px] sm:text-[40px] font-semibold leading-tight tracking-[0.06em]"
                style={{ color: 'var(--tx-0)' }}
              >
                {star}入{data.palaceTitle}
              </h1>
              {STAR_BRIEF_SEO[star] && (
                <p className="mt-3 text-[14px] leading-relaxed max-w-[60ch]" style={{ color: 'var(--tx-3)' }}>
                  {STAR_BRIEF_SEO[star]}
                </p>
              )}
            </header>

            {data.parsed.dingdiao && (
              <blockquote
                className="mb-12 max-w-[68ch] pl-5 text-[19px] sm:text-[21px] leading-[1.7] font-medium"
                style={{ color: 'var(--tx-0)', borderLeft: '2px solid var(--ac)', textWrap: 'pretty' }}
              >
                {data.parsed.dingdiao}
              </blockquote>
            )}

            <div className="reading-prose">
              {data.parsed.lundian && (
                <>
                  <h3>核心论断</h3>
                  <Paragraphs text={data.parsed.lundian} />
                </>
              )}
              {data.parsed.yiju && (
                <>
                  <h3>命盘依据</h3>
                  <Paragraphs text={data.parsed.yiju} />
                </>
              )}
            </div>

            {data.parsed.chuchu && (
              <section aria-labelledby="sources-title" className="mt-10 max-w-[68ch] rounded-xl p-5" style={{ background: 'var(--bg-1)', border: '1px solid var(--bdr)' }}>
                <h2 id="sources-title" className="text-[13px] font-semibold mb-3 tracking-[0.08em]" style={{ color: 'var(--tx-0)' }}>
                  经典出处
                </h2>
                <ul className="space-y-2.5">
                  {data.parsed.chuchu.split('\n').filter(l => l.trim()).map((line, i) => (
                    <li key={i} className="text-[13px] leading-[1.8]" style={{ color: 'var(--tx-2)' }}>{line}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="card-glass mt-12 max-w-[68ch] rounded-2xl p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--tx-0)' }}>看看你自己命盘的{data.topicLabel}</p>
                <p className="text-[13px]" style={{ color: 'var(--tx-2)' }}>输入生辰起盘，十三个主题逐项解读。</p>
              </div>
              <Link
                href="/chart"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full px-6 text-[14px] font-semibold tracking-[0.1em] transition-transform hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, #9a6210, #c88020)', color: '#fff8e8', boxShadow: '0 6px 20px rgba(140,100,20,0.25)' }}
              >
                立即起盘
              </Link>
            </section>

            <section aria-labelledby="same-palace-title" className="mt-14 max-w-[68ch]">
              <h2 id="same-palace-title" className="text-[14px] font-semibold mb-3" style={{ color: 'var(--tx-0)' }}>
                其他主星入{data.palaceTitle}
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherStarsForTopic.map(s => (
                  <Link key={s} href={`/knowledge/${STAR_TO_SLUG[s]}/${topic}`} className="chip">
                    {s}
                  </Link>
                ))}
              </div>
            </section>
          </article>

          {/* 本星十三宫目录 */}
          <aside aria-label={`${star}在各宫的解读`} className="lg:sticky lg:top-20 lg:self-start">
            <p className="text-[12px] mb-2 px-3 tracking-[0.12em]" style={{ color: 'var(--tx-3)' }}>{star} · 十三宫</p>
            <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {ALL_TOPICS.filter(t => getKnowledge(star, t).exists).map(t => {
                const d = getKnowledge(star, t);
                const current = t === topic;
                return (
                  <li key={t}>
                    <Link
                      href={`/knowledge/${slug}/${t}`}
                      aria-current={current ? 'page' : undefined}
                      className="topic-link"
                    >
                      <span>{d.palaceTitle}</span>
                      <span className="text-[11px]" style={{ color: 'var(--tx-3)' }}>{d.topicLabel}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-[12px] leading-relaxed" style={{ borderTop: '1px solid var(--bdr)', color: 'var(--tx-3)' }}>
        <p>基于倪海厦正宗体系 · 仅供学习参考</p>
        <p>本平台不构成任何医疗、投资、法律或重大决策建议</p>
      </footer>
    </>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n+/).filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
    </>
  );
}
