/**
 * /knowledge/[star]/[topic] — Trang SEO chi tiết
 *
 * 14 chính tinh × 13 topic = 182 URL độc lập
 * Mỗi trang chứa đầy đủ 4 đoạn luận giải từ STAR_DB
 * (Nhất câu định điệu / Luận điểm cốt lõi / Căn cứ lá số / Xuất xứ cổ điển)
 *
 * Điểm SEO:
 *  - title chứa từ khóa chính (ví dụ: "Tử Vi nhập Mệnh cung · luận giải hệ Nghê Hải Hạ")
 *  - description dùng dingdiao (nhất câu định điệu)
 *  - JSON-LD Article dữ liệu có cấu trúc
 *  - Nội liên: 12 cung khác cùng chính tinh + 13 chính tinh khác cùng cung
 *  - generateStaticParams tĩnh, không tốn tài nguyên runtime
 */

import Link from 'next/link';
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

export const dynamicParams = false;

export async function generateStaticParams() {
  const routes = getAllKnowledgeRoutes();
  return routes.map(r => ({ star: r.slug, topic: r.topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) return {};
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) return {};

  const title = `${star} nhập ${data.palaceName} cung · ${data.topicLabel} · Luận giải hệ Nghê Hải Hạ`;
  const description = data.parsed.dingdiao
    || `Luận giải Tử Vi Đẩu Số ${star} nhập ${data.palaceName} cung — Theo hệ thống Thiên Kỷ của Nghê Hải Hạ và cổ tịch Tử Vi Đẩu Số Toàn Tập, Cốt Tủy Phú.`;

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
      'tử vi đẩu số', 'nghê hải hạ', star, data.palaceName, data.topicLabel,
      `${star}${data.palaceName}`, `${star} nhập ${data.palaceName}`,
      `tử vi đẩu số ${star}`, 'nghê hải hạ tử vi đẩu số', 'tử vi đẩu số toàn tập',
    ],
  };
}

export default async function KnowledgePage({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) notFound();
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) notFound();

  const otherTopicsForStar = ALL_TOPICS.filter(t => t !== topic && getKnowledge(star, t).exists);
  const otherStarsForTopic = ALL_STARS.filter(s => s !== star && getKnowledge(s, topic as TopicKey).exists);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${star} nhập ${data.palaceName} cung · ${data.topicLabel}`,
    description: data.parsed.dingdiao,
    author: { '@type': 'Organization', name: 'Nghiên Cứu Tử Vi · Chính Tông Nghê Hải Hạ' },
    publisher: {
      '@type': 'Organization',
      name: 'Nghiên Cứu Tử Vi',
      url: SITE_URL,
    },
    datePublished: '2026-04-28',
    dateModified: '2026-04-28',
    mainEntityOfPage: `${SITE_URL}/knowledge/${slug}/${topic}`,
    articleSection: 'Tử Vi Đẩu Số · Hệ Nghê Hải Hạ',
    keywords: [`tử vi đẩu số`, star, data.palaceName, data.topicLabel].join(', '),
  };

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Thanh trên */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← Trang chủ
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
          Phương pháp luận Nghê Hải Hạ · Kho kiến thức
        </div>
        <Link href="/chart" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          Lập lá số →
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.1em', marginBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>Trang chủ</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/knowledge" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>Kho kiến thức</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{star}</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <span style={{ color: 'var(--ac)' }}>Cung {data.palaceName}</span>
        </nav>

        {/* Tiêu đề */}
        <header style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.25em', marginBottom: '8px' }}>
            {data.topicLabel} · Luận giải chi tiết hệ Nghê Hải Hạ
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em', lineHeight: 1.2 }}>
            {star} nhập {data.palaceName} cung
          </h1>
          {STAR_BRIEF_SEO[star] && (
            <p style={{ fontSize: '13px', color: 'var(--tx-2)', marginTop: '14px', lineHeight: 1.8 }}>
              {STAR_BRIEF_SEO[star]}
            </p>
          )}
        </header>

        {/* Nội dung 4 đoạn */}
        {data.parsed.dingdiao && (
          <Section title="Nhất Câu Định Điệu" gradient>
            <p style={{ fontSize: '17px', color: 'var(--tx-0)', lineHeight: 1.9, fontWeight: 500, letterSpacing: '0.04em' }}>
              {data.parsed.dingdiao}
            </p>
          </Section>
        )}

        {data.parsed.lundian && (
          <Section title="Luận Điểm Cốt Lõi">
            <div style={{ fontSize: '15px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.lundian}
            </div>
          </Section>
        )}

        {data.parsed.yiju && (
          <Section title="Căn Cứ Lá Số">
            <div style={{ fontSize: '14px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.yiju}
            </div>
          </Section>
        )}

        {data.parsed.chuchu && (
          <Section title="Xuất Xứ Cổ Điển" minimal>
            <div style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.chuchu}
            </div>
          </Section>
        )}

        {/* CTA */}
        <div style={{
          margin: '40px 0 30px',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(212,169,72,0.15) 0%, rgba(184,146,42,0.06) 100%)',
          borderRadius: '14px',
          border: '1px solid rgba(184,146,42,0.3)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--tx-0)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '6px' }}>
            Muốn xem {data.topicLabel} trong lá số của bạn?
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tx-2)', marginBottom: '16px' }}>
            Nhập ngày sinh lập lá số · Luận giải chính tông Nghê Hải Hạ · AI hỗ trợ học tập
          </div>
          <Link href="/chart" style={{
            display: 'inline-block',
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #d4a948 0%, #b8922a 100%)',
            color: 'white',
            borderRadius: '999px',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(184,146,42,0.3)',
          }}>
            Lập lá số ngay →
          </Link>
        </div>

        {/* Nội liên: các cung khác cùng chính tinh */}
        <Section title={`Các cung khác của ${star}`} minimal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {otherTopicsForStar.map(t => {
              const d = getKnowledge(star, t);
              return (
                <Link
                  key={t}
                  href={`/knowledge/${slug}/${t}`}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(184,146,42,0.25)',
                    borderRadius: '999px',
                    color: 'var(--tx-2)',
                    textDecoration: 'none',
                  }}
                >
                  {star} nhập {d.palaceName}
                </Link>
              );
            })}
          </div>
        </Section>

        {/* Nội liên: các chính tinh khác cùng cung */}
        <Section title={`Các chính tinh khác nhập cung ${data.palaceName}`} minimal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {otherStarsForTopic.slice(0, 13).map(s => (
              <Link
                key={s}
                href={`/knowledge/${STAR_TO_SLUG[s]}/${topic}`}
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(184,146,42,0.25)',
                  borderRadius: '999px',
                  color: 'var(--tx-2)',
                  textDecoration: 'none',
                }}
              >
                {s} nhập {data.palaceName}
              </Link>
            ))}
          </div>
        </Section>

        {/* Link kho cổ tịch */}
        <div style={{
          marginTop: '40px',
          padding: '16px 20px',
          background: 'rgba(184,146,42,0.04)',
          border: '1px dashed rgba(184,146,42,0.25)',
          borderRadius: '10px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--ac-dim)', letterSpacing: '0.15em', marginBottom: '6px' }}>
            Muốn đọc nguyên điển?
          </div>
          <Link href="/library" style={{ fontSize: '13px', color: 'var(--ac)', fontWeight: 500, letterSpacing: '0.1em', textDecoration: 'none' }}>
            📜 Tra cứu kho cổ tịch nguyên điển — Tử Vi Đẩu Số Toàn Tập / Toàn Thư / Cốt Tủy Phú →
          </Link>
        </div>
      </article>

      {/* Chân trang */}
      <footer style={{ borderTop: '1px solid rgba(184,146,42,0.15)', padding: '20px 24px', textAlign: 'center', fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.1em' }}>
        <div style={{ marginBottom: '6px' }}>Nghiên Cứu Tử Vi · Theo hệ thống chính tông Nghê Hải Hạ · Chỉ dùng để học tập tham khảo</div>
        <div style={{ opacity: 0.85 }}>Nền tảng này không cấu thành bất kỳ lời khuyên y tế, đầu tư, pháp lý hoặc quyết định quan trọng nào</div>
      </footer>
    </div>
  );
}

function Section({ title, children, gradient, minimal }: { title: string; children: React.ReactNode; gradient?: boolean; minimal?: boolean }) {
  return (
    <section style={{ marginBottom: minimal ? '24px' : '32px' }}>
      <h2 style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: 'var(--ac)',
        fontWeight: 600,
        letterSpacing: '0.2em',
        marginBottom: '12px',
      }}>
        <span style={{ width: '4px', height: '14px', background: 'var(--ac)', borderRadius: '2px' }} />
        {title}
      </h2>
      <div style={{
        background: gradient
          ? 'linear-gradient(135deg, rgba(212,169,72,0.12) 0%, rgba(184,146,42,0.04) 100%)'
          : 'white',
        border: '1px solid rgba(184,146,42,0.15)',
        borderRadius: '10px',
        padding: minimal ? '14px 18px' : '20px 22px',
      }}>
        {children}
      </div>
    </section>
  );
}
