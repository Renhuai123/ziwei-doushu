'use client';

/**
 * /library — kho cổ tịch (đa ngôn ngữ).
 *
 * Tên sách, triều đại, tác giả và phần giới thiệu lấy từ messages/*.json
 * → library.books.<slug>; nguyên văn Hán văn vẫn lấy từ lib/classics.
 */

import Link from 'next/link';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import { useLanguage } from '@/components/LanguageProvider';
import { formatMessage } from '@/lib/i18n/format';
import LibrarySearch from './LibrarySearch';

export default function LibraryHomeView() {
  const { t } = useLanguage();
  const fmt = (key: string, vars: Record<string, string | number>) =>
    formatMessage(t(key), vars);
  const bookText = (slug: string, key: string, fallback: string) => {
    const key_ = `library.books.${slug}.${key}`;
    const value = t(key_);
    return value === key_ ? fallback : value;
  };

  // Tô đậm các con số trong câu thống kê: tách theo placeholder rồi ghép lại.
  const statsLine = t('library.descriptionLine2')
    .split(/(\{books\}|\{paragraphs\})/g)
    .map((segment, i) => {
      if (segment === '{books}') return <strong key={i} style={{ color: 'var(--ac)' }}>{ALL_BOOKS.length}</strong>;
      if (segment === '{paragraphs}') return <strong key={i} style={{ color: 'var(--ac)' }}>{TOTAL_PARAGRAPHS}</strong>;
      return <span key={i}>{segment}</span>;
    });

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* 顶栏 */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          {t('library.backHome')}
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.3em' }}>
          {t('library.topbar')}
        </div>
        <Link href="/chart" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          {t('library.startChart')}
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center px-6 py-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(184,146,42,0.4))' }} />
          <span style={{ fontSize: '11px', color: 'var(--ac)', letterSpacing: '0.4em' }}>{t('library.eyebrow')}</span>
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(184,146,42,0.4))' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '12px' }}>
          {t('library.title')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.1em', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
          {t('library.descriptionLine1')}<br />
          {statsLine}
        </p>
      </div>

      {/* 搜索 */}
      <div className="max-w-2xl mx-auto px-6 mb-12">
        <LibrarySearch />
      </div>

      {/* 古籍列表 */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_BOOKS.map(book => {
            const title = bookText(book.slug, 'title', book.title);
            const dynasty = bookText(book.slug, 'dynasty', book.dynasty);
            const author = bookText(book.slug, 'author', book.author);
            const intro = bookText(book.slug, 'intro', book.intro);
            const paragraphs = book.chapters.reduce((s, c) => s + c.paragraphs.length, 0);
            return (
              <Link
                key={book.slug}
                href={`/library/${book.slug}`}
                style={{
                  display: 'block',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(184,146,42,0.2)',
                  borderRadius: '14px',
                  padding: '24px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(184,146,42,0.06)',
                }}
                className="hover:shadow-lg"
              >
                <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.2em', marginBottom: '6px' }}>
                  {dynasty} · {author}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px', letterSpacing: '0.1em' }}>
                  {title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '14px' }}>
                  {intro}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--tx-3)' }}>
                  <span>{fmt('library.chaptersCount', { n: book.chapters.length })}</span>
                  <span style={{ color: 'rgba(184,146,42,0.4)' }}>·</span>
                  <span>{fmt('library.paragraphsCount', { n: paragraphs })}</span>
                </div>
                <div style={{
                  display: 'inline-flex',
                  marginTop: '14px',
                  fontSize: '11px',
                  color: 'var(--ac)',
                  letterSpacing: '0.15em',
                  fontWeight: 500,
                }}>
                  {t('library.enter')}
                </div>
              </Link>
            );
          })}
        </div>

        {/* 底部说明 */}
        <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(184,146,42,0.05)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--ac-dim)', fontWeight: 600, letterSpacing: '0.15em', marginBottom: '8px' }}>
            {t('library.aboutTitle')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
            {t('library.aboutLine1')}<br />
            {t('library.aboutLine2')}<br />
            {t('library.aboutLine3')}
          </div>
        </div>
      </div>
    </div>
  );
}
