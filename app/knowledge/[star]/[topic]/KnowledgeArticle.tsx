'use client';

/**
 * /knowledge/[star]/[topic] — bài tri thức (đa ngôn ngữ).
 *
 * Nội dung luận giải lấy từ STAR_DB; toàn bộ nhãn giao diện lấy từ
 * messages/*.json → knowledge.
 */

import Link from 'next/link';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import {
  ALL_STARS,
  ALL_TOPICS,
  getKnowledge,
  STAR_TO_SLUG,
  SLUG_TO_STAR,
} from '@/lib/seo/knowledge';
import { useLanguage } from '@/components/LanguageProvider';
import { formatMessage } from '@/lib/i18n/format';

export default function KnowledgeArticle({ slug, topic }: { slug: string; topic: string }) {
  const { t } = useLanguage();
  const fmt = (key: string, vars: Record<string, string | number>) =>
    formatMessage(t(key), vars);

  const star = SLUG_TO_STAR[slug];
  if (!star) return null;

  const topicKey = topic as TopicKey;
  const data = getKnowledge(star, topicKey);
  if (!data.exists) return null;

  const starName = t(`knowledge.starNames.${slug}`);
  const topicLabel = t(`knowledge.topics.${topic}`);
  const palaceLabel = t(`knowledge.palaces.${topic}`);
  const palaceChip = fmt('knowledge.palaceChip', { palace: palaceLabel });
  const heading = fmt('knowledge.enterPalace', { star: starName, palace: palaceLabel });

  const otherTopicsForStar = ALL_TOPICS.filter(tp => tp !== topicKey && getKnowledge(star, tp).exists);
  const otherStarsForTopic = ALL_STARS.filter(s => s !== star && getKnowledge(s, topicKey).exists);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* 顶栏 */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← {t('knowledge.home')}
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
          {t('knowledge.topbar')}
        </div>
        <Link href="/chart" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          {t('knowledge.startChart')}
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* 面包屑 */}
        <nav style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.1em', marginBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>{t('knowledge.home')}</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/knowledge" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>{t('knowledge.breadcrumb')}</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{starName}</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <span style={{ color: 'var(--ac)' }}>{palaceChip}</span>
        </nav>

        {/* 标题区 */}
        <header style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.25em', marginBottom: '8px' }}>
            {fmt('knowledge.detailEyebrow', { topic: topicLabel })}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em', lineHeight: 1.2 }}>
            {heading}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', marginTop: '14px', lineHeight: 1.8 }}>
            {t(`knowledge.starBriefs.${slug}`)}
          </p>
        </header>

        {/* 内容 4 段 */}
        {data.parsed.dingdiao && (
          <Section title={t('knowledge.sections.dingdiao')} gradient>
            <p style={{ fontSize: '17px', color: 'var(--tx-0)', lineHeight: 1.9, fontWeight: 500, letterSpacing: '0.04em' }}>
              {data.parsed.dingdiao}
            </p>
          </Section>
        )}

        {data.parsed.lundian && (
          <Section title={t('knowledge.sections.lundian')}>
            <div style={{ fontSize: '15px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.lundian}
            </div>
          </Section>
        )}

        {data.parsed.yiju && (
          <Section title={t('knowledge.sections.yiju')}>
            <div style={{ fontSize: '14px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.yiju}
            </div>
          </Section>
        )}

        {data.parsed.chuchu && (
          <Section title={t('knowledge.sections.chuchu')} minimal>
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
            {fmt('knowledge.ctaTitle', { topic: topicLabel })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tx-2)', marginBottom: '16px' }}>
            {t('knowledge.ctaSubtitle')}
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
            {t('knowledge.ctaButton')}
          </Link>
        </div>

        {/* 内链：同主星其他 topic */}
        <Section title={fmt('knowledge.otherPalaces', { star: starName })} minimal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {otherTopicsForStar.map(tp => (
              <Link
                key={tp}
                href={`/knowledge/${slug}/${tp}`}
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
                {fmt('knowledge.enterPalace', {
                  star: starName,
                  palace: t(`knowledge.palaces.${tp}`),
                })}
              </Link>
            ))}
          </div>
        </Section>

        {/* 内链：同 topic 其他主星 */}
        <Section title={fmt('knowledge.otherStars', { palace: palaceLabel })} minimal>
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
                {fmt('knowledge.enterPalace', {
                  star: t(`knowledge.starNames.${STAR_TO_SLUG[s]}`),
                  palace: palaceLabel,
                })}
              </Link>
            ))}
          </div>
        </Section>

        {/* 古籍库链接 */}
        <div style={{
          marginTop: '40px',
          padding: '16px 20px',
          background: 'rgba(184,146,42,0.04)',
          border: '1px dashed rgba(184,146,42,0.25)',
          borderRadius: '10px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--ac-dim)', letterSpacing: '0.15em', marginBottom: '6px' }}>
            {t('knowledge.classicsTitle')}
          </div>
          <Link href="/library" style={{ fontSize: '13px', color: 'var(--ac)', fontWeight: 500, letterSpacing: '0.1em', textDecoration: 'none' }}>
            {t('knowledge.classicsCta')}
          </Link>
        </div>
      </article>

      {/* 页脚 */}
      <footer style={{ borderTop: '1px solid rgba(184,146,42,0.15)', padding: '20px 24px', textAlign: 'center', fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.1em' }}>
        <div style={{ marginBottom: '6px' }}>{t('knowledge.footerLine1')}</div>
        <div style={{ opacity: 0.85 }}>{t('knowledge.footerLine2')}</div>
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
