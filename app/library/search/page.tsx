/**
 * /library/search?q=xxx — 搜索结果页
 */

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { searchClassics, getParagraphById, SUGGESTED_QUERIES } from '@/lib/classics';
import LibrarySearch from '../LibrarySearch';

export const metadata = {
  title: '搜索 · 古籍原典库',
  // 搜索结果是查询参数拼出来的页面，不进索引，但允许顺着结果链接抓取原文页
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const hits = q ? searchClassics(q, 50) : [];

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[880px] px-4 sm:px-6 pb-24 pt-8 sm:pt-10">
        <nav aria-label="面包屑" className="mb-6 flex flex-wrap items-center gap-x-2 text-[13px]" style={{ color: 'var(--tx-3)' }}>
          <Link href="/library" className="hover:text-[var(--tx-0)]">古籍</Link>
          <span aria-hidden>/</span>
          <span aria-current="page" style={{ color: 'var(--tx-1)' }}>搜索</span>
        </nav>

        <div className="mb-8">
          <LibrarySearch key={q} defaultValue={q} />
        </div>

        {q && (
          <h1 className="mb-5 text-[14px]" style={{ color: 'var(--tx-2)' }}>
            「<span style={{ color: 'var(--tx-0)' }}>{q}</span>」共 <strong className="tabular-nums" style={{ color: 'var(--tx-0)' }}>{hits.length}</strong> 条原文匹配
            {hits.length === 50 && <span style={{ color: 'var(--tx-3)' }}>（最多显示 50 条）</span>}
          </h1>
        )}

        {hits.length === 0 ? (
          <div className="card-glass rounded-2xl px-6 py-10 text-center">
            <p className="text-[15px] font-medium mb-2" style={{ color: 'var(--tx-0)' }}>
              {q ? '已收录古籍里没有找到这个词' : '输入关键词开始搜索'}
            </p>
            <p className="text-[13px] mb-5" style={{ color: 'var(--tx-3)' }}>
              {q ? '换个说法，或试试这些常见检索：' : '可以搜星曜、格局、四化或宫位：'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUERIES.map(s => (
                <Link key={s} href={`/library/search?q=${encodeURIComponent(s)}`} className="chip">{s}</Link>
              ))}
            </div>
          </div>
        ) : (
          <ol className="card-glass rounded-2xl">
            {hits.map((hit, i) => {
              const ctx = getParagraphById(hit.paragraphId);
              const chapterIdx = ctx?.chapterIdx ?? 0;
              return (
                <li key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--bdr)' }}>
                  <Link
                    href={`/library/${hit.bookSlug}/${chapterIdx}#${hit.paragraphId}`}
                    className="block px-5 sm:px-6 py-4 transition-colors hover:bg-[var(--ac-bg)]"
                  >
                    <span className="mb-1.5 flex items-center gap-2 text-[12px]" style={{ color: 'var(--tx-3)' }}>
                      <span className="font-medium" style={{ color: 'var(--ac)' }}>《{hit.bookTitle}》</span>
                      <span aria-hidden>·</span>
                      <span>{hit.chapterTitle}</span>
                    </span>
                    {/* snippet 由 searchClassics 生成：原文已 escapeHtml，只额外包了 <mark> */}
                    <span
                      className="search-snippet block text-[15px] leading-[1.9]"
                      style={{ color: 'var(--tx-1)' }}
                      dangerouslySetInnerHTML={{ __html: hit.snippet }}
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}
