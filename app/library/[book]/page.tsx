/**
 * /library/[book] — 单部古籍目录页
 */

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getBookBySlug } from '@/lib/classics';

export async function generateStaticParams() {
  return ALL_BOOKS.map(b => ({ book: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return {};
  return {
    title: `《${book.title}》· ${book.dynasty} · 紫微斗数古籍原典库`,
    description: book.intro,
    alternates: { canonical: `/library/${book.slug}` },
  };
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  const totalParagraphs = book.chapters.reduce((n, c) => n + c.paragraphs.length, 0);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[880px] px-4 sm:px-6 pb-24 pt-8 sm:pt-10">
        <nav aria-label="面包屑" className="mb-8 flex flex-wrap items-center gap-x-2 text-[13px]" style={{ color: 'var(--tx-3)' }}>
          <Link href="/library" className="hover:text-[var(--tx-0)]">古籍</Link>
          <span aria-hidden>/</span>
          <span aria-current="page" style={{ color: 'var(--tx-1)' }}>《{book.title}》</span>
        </nav>

        <header className="mb-10 max-w-[640px]">
          <p className="eyebrow mb-3">{book.dynasty} · {book.author}</p>
          <h1 className="text-[30px] sm:text-[38px] font-semibold leading-tight tracking-[0.06em] mb-3" style={{ color: 'var(--tx-0)' }}>
            《{book.title}》
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--tx-2)' }}>{book.intro}</p>
          <p className="mt-3 text-[13px] tabular-nums" style={{ color: 'var(--tx-3)' }}>
            {book.chapters.length} 章 · {totalParagraphs} 段原文
          </p>
        </header>

        <section aria-labelledby="toc-title" className="card-glass rounded-2xl">
          <h2 id="toc-title" className="px-5 sm:px-6 pt-5 pb-3 text-[14px] font-semibold" style={{ color: 'var(--tx-0)' }}>目录</h2>
          <ol>
            {book.chapters.map((chapter, i) => (
              <li key={i} style={{ borderTop: '1px solid var(--bdr)' }}>
                <Link
                  href={`/library/${book.slug}/${i}`}
                  className="group flex items-baseline gap-4 px-5 sm:px-6 py-4 transition-colors hover:bg-[var(--ac-bg)]"
                >
                  <span className="w-7 shrink-0 text-[12px] font-medium tabular-nums" style={{ color: 'var(--ac)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium tracking-[0.04em]" style={{ color: 'var(--tx-0)' }}>
                      {chapter.title}
                    </span>
                    {chapter.subtitle && (
                      <span className="mt-0.5 block text-[12px]" style={{ color: 'var(--tx-3)' }}>{chapter.subtitle}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-[12px] tabular-nums" style={{ color: 'var(--tx-3)' }}>
                    {chapter.paragraphs.length} 段
                  </span>
                  <span aria-hidden className="shrink-0 text-[13px] transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--ac)' }}>→</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
