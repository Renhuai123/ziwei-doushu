'use client';

/**
 * /knowledge — giao diện kho tri thức (đa ngôn ngữ).
 *
 * Dữ liệu 14 chính tinh vẫn lấy từ lib/seo/knowledge; toàn bộ nhãn hiển thị
 * lấy từ messages/*.json → knowledge.
 */

import Link from 'next/link';
import { ALL_STARS, ALL_TOPICS, getKnowledge, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { useLanguage } from '@/components/LanguageProvider';
import { formatMessage } from '@/lib/i18n/format';

export default function KnowledgeHomeView() {
  const { t } = useLanguage();
  const fmt = (key: string, vars: Record<string, string | number>) =>
    formatMessage(t(key), vars);
  const starName = (star: string) => t(`knowledge.starNames.${STAR_TO_SLUG[star]}`);
  const statsParts = t('knowledge.stats').split('{count}');

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
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          {t('knowledge.classicsLink')}
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center px-6 py-14">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(184,146,42,0.4))' }} />
          <span style={{ fontSize: '11px', color: 'var(--ac)', letterSpacing: '0.4em' }}>KNOWLEDGE BASE</span>
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(184,146,42,0.4))' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '12px' }}>
          {t('knowledge.title')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.08em', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
          {statsParts[0]}
          <strong style={{ color: 'var(--ac)' }}>{ALL_STARS.length * ALL_TOPICS.length}</strong>
          {statsParts[1] ?? ''}
          <br />
          {t('knowledge.source')}
        </p>
      </div>

      {/* 14 主星卡片 */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.3em', textAlign: 'center', marginBottom: '24px' }}>
          {t('knowledge.starsHeading')}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_STARS.map(star => (
            <Link
              key={star}
              href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}
              style={{
                display: 'block',
                padding: '14px 10px',
                background: 'var(--bg-card)',
                border: '1px solid rgba(184,146,42,0.2)',
                borderRadius: '10px',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
              className="hover:shadow-md hover:border-amber-400"
            >
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em' }}>
                {starName(star)}
              </div>
            </Link>
          ))}
        </div>

        {/* 详细列表（每个主星 + 简介 + 进入按钮） */}
        <div className="mt-14 space-y-4">
          {ALL_STARS.map(star => (
            <div key={star} style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(184,146,42,0.18)',
              borderRadius: '12px',
              padding: '18px 22px',
            }}>
              <div className="flex items-baseline gap-3 mb-2">
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
                  {starName(star)}{t('knowledge.starSuffix')}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.15em' }}>
                  {star} · {t('knowledge.cardTag')}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '12px' }}>
                {t(`knowledge.starBriefs.${STAR_TO_SLUG[star]}`)}
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOPICS.map(topic => {
                  const k = getKnowledge(star, topic);
                  if (!k.exists) return null;
                  return (
                    <Link
                      key={topic}
                      href={`/knowledge/${STAR_TO_SLUG[star]}/${topic}`}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        background: 'rgba(184,146,42,0.06)',
                        border: '1px solid rgba(184,146,42,0.15)',
                        borderRadius: '999px',
                        color: 'var(--tx-2)',
                        textDecoration: 'none',
                      }}
                    >
                      {fmt('knowledge.entry', {
                        palace: t(`knowledge.palaces.${topic}`),
                        topic: t(`knowledge.topics.${topic}`),
                      })}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
