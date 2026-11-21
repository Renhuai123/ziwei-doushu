/**
 * /library/[book]/[chapter] — 单章节阅读页
 */

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import HashHighlight from './HashHighlight';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getChapter } from '@/lib/classics';

export async function generateStaticParams() {
  return ALL_BOOKS.flatMap(b =>
    b.chapters.map((_, i) => ({ book: b.slug, chapter: String(i) }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) return {};
  return {
    title: `${result.chapter.title} · 《${result.book.title}》· 紫微斗数古籍`,
    description: result.chapter.subtitle || `《${result.book.title}》${result.chapter.title}原文`,
    alternates: { canonical: `/library/${result.book.slug}/${result.chapterIdx}` },
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) notFound();

  const { book, chapter, chapterIdx } = result;
  const prevIdx = chapterIdx - 1;
  const nextIdx = chapterIdx + 1;

  const prev = prevIdx >= 0 ? book.chapters[prevIdx] : null;
  const next = nextIdx < book.chapters.length ? book.chapters[nextIdx] : null;

  return (
    <>
      <SiteHeader />
      <HashHighlight />
      <main id="main" className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 pb-24 pt-8 sm:pt-10">
        <nav aria-label="面包屑" className="mb-8 flex flex-wrap items-center gap-x-2 text-[13px]" style={{ color: 'var(--tx-3)' }}>
          <Link href="/library" className="hover:text-[var(--tx-0)]">古籍</Link>
          <span aria-hidden>/</span>
          <Link href={`/library/${book.slug}`} className="hover:text-[var(--tx-0)]">《{book.title}》</Link>
          <span aria-hidden>/</span>
          <span aria-current="page" style={{ color: 'var(--tx-1)' }}>{chapter.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-14">
          <article className="min-w-0">
            <header className="mb-10">
              <p className="eyebrow mb-3">《{book.title}》· 第 {chapterIdx + 1} 章</p>
              <h1 className="text-[28px] sm:text-[36px] font-semibold leading-tight tracking-[0.06em]" style={{ color: 'var(--tx-0)' }}>
                {chapter.title}
              </h1>
              {chapter.subtitle && (
                <p className="mt-3 text-[14px]" style={{ color: 'var(--tx-3)' }}>{chapter.subtitle}</p>
              )}
            </header>

            <ol className="max-w-[68ch]">
              {chapter.paragraphs.map(p => (
                <li key={p.id} id={p.id} className="classic-para scroll-mt-24 grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 py-5" style={{ borderTop: '1px solid var(--bdr)' }}>
                  <a href={`#${p.id}`} className="pt-1.5 text-[12px] font-medium tabular-nums hover:underline" style={{ color: 'var(--ac)' }} aria-label={`第 ${p.idx} 段`}>
                    {String(p.idx).padStart(2, '0')}
                  </a>
                  <div>
                    <p className="text-[17px] leading-[2] tracking-[0.04em]" style={{ color: 'var(--tx-0)', fontFamily: '"Songti SC", "Noto Serif SC", "Source Han Serif SC", serif' }}>
                      {p.text}
                    </p>
                    {p.translation && (
                      <p className="mt-3 pl-3 text-[14px] leading-[1.85]" style={{ color: 'var(--tx-2)', borderLeft: '2px solid var(--ac-bdr)' }}>
                        <span className="mr-2 text-[11px] font-medium tracking-[0.1em]" style={{ color: 'var(--ac)' }}>白话</span>
                        {p.translation}
                      </p>
                    )}
                    {p.niNote && (
                      <p className="mt-3 pl-3 text-[14px] leading-[1.85]" style={{ color: 'var(--tx-2)', borderLeft: '2px solid var(--ji)' }}>
                        <span className="mr-2 text-[11px] font-medium tracking-[0.1em]" style={{ color: 'var(--ji)' }}>倪师注</span>
                        {p.niNote}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <nav aria-label="章节翻页" className="mt-10 grid max-w-[68ch] grid-cols-2 gap-3">
              {prev ? (
                <Link href={`/library/${book.slug}/${prevIdx}`} className="card-glass rounded-xl px-4 py-3 transition-colors hover:border-[var(--ac-bdr)]">
                  <span className="block text-[12px] mb-0.5" style={{ color: 'var(--tx-3)' }}>← 上一章</span>
                  <span className="block text-[14px] font-medium truncate" style={{ color: 'var(--tx-0)' }}>{prev.title}</span>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={`/library/${book.slug}/${nextIdx}`} className="card-glass rounded-xl px-4 py-3 text-right transition-colors hover:border-[var(--ac-bdr)]">
                  <span className="block text-[12px] mb-0.5" style={{ color: 'var(--tx-3)' }}>下一章 →</span>
                  <span className="block text-[14px] font-medium truncate" style={{ color: 'var(--tx-0)' }}>{next.title}</span>
                </Link>
              ) : <span />}
            </nav>
          </article>

          <aside aria-label={`《${book.title}》目录`} className="lg:sticky lg:top-20 lg:self-start">
            <p className="text-[12px] mb-2 px-3 tracking-[0.12em]" style={{ color: 'var(--tx-3)' }}>《{book.title}》目录</p>
            <ol className="lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto space-y-0.5">
              {book.chapters.map((c, i) => (
                <li key={i}>
                  <Link
                    href={`/library/${book.slug}/${i}`}
                    aria-current={i === chapterIdx ? 'page' : undefined}
                    className="topic-link !justify-start gap-3"
                  >
                    <span className="w-5 shrink-0 text-[11px] tabular-nums" style={{ color: 'var(--tx-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="truncate">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </main>
    </>
  );
}
