/**
 * 古籍原典查询库 · 主页
 * 全文搜索入口 + 收录古籍列表
 */

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import PageIntro from '@/components/PageIntro';
import { ALL_BOOKS, SUGGESTED_QUERIES, TOTAL_PARAGRAPHS } from '@/lib/classics';
import LibrarySearch from './LibrarySearch';

export const metadata = {
  title: '倪师方法论 · 古籍原典库 · 紫微斗数全集 / 全书 / 骨髓赋',
  alternates: { canonical: '/library' },
  description: '紫微斗数权威古籍全文检索：《紫微斗数全集》《紫微斗数全书》《骨髓赋》倪海厦《天纪》引证来源',
};

export default function LibraryHomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 pb-24 pt-10 sm:pt-14">
        <PageIntro eyebrow="古籍原典" title="回到原文，查每一句出处" className="mb-8">
          收录 <strong style={{ color: 'var(--tx-0)' }}>{ALL_BOOKS.length}</strong> 部紫微斗数古籍、
          <strong style={{ color: 'var(--tx-0)' }}>{TOTAL_PARAGRAPHS}</strong> 段原文，可全文搜索，也可逐章阅读。
        </PageIntro>

        <div className="max-w-[640px] mb-14">
          <LibrarySearch />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px]" style={{ color: 'var(--tx-3)' }}>试试</span>
            {SUGGESTED_QUERIES.map(q => (
              <Link key={q} href={`/library/search?q=${encodeURIComponent(q)}`} className="chip !h-7 !text-[12px]">
                {q}
              </Link>
            ))}
          </div>
        </div>

        <section aria-labelledby="books-title">
          <h2 id="books-title" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--tx-0)' }}>收录古籍</h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ALL_BOOKS.map(book => (
              <li key={book.slug}>
                <Link
                  href={`/library/${book.slug}`}
                  className="card-glass group flex h-full flex-col rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
                >
                  <span className="text-[12px] tracking-[0.12em] mb-2" style={{ color: 'var(--tx-3)' }}>
                    {book.dynasty} · {book.author.split(' ')[0]}
                  </span>
                  <span className="text-[20px] font-semibold tracking-[0.08em] mb-3" style={{ color: 'var(--tx-0)' }}>
                    《{book.title}》
                  </span>
                  <span className="text-[13px] leading-[1.75] mb-5 flex-1" style={{ color: 'var(--tx-2)' }}>
                    {book.intro}
                  </span>
                  <span className="flex items-center justify-between text-[12px]" style={{ color: 'var(--tx-3)' }}>
                    <span className="tabular-nums">
                      {book.chapters.length} 章 · {book.chapters.reduce((s, c) => s + c.paragraphs.length, 0)} 段
                    </span>
                    <span className="transition-colors group-hover:text-[var(--ac)]">阅读 →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-14 max-w-[640px] text-[12px] leading-[1.8]" style={{ color: 'var(--tx-3)' }}>
          所收古籍均为公版（明代刊本）。内容持续完善，计划补全《紫微斗数全集》全本与倪海厦《天纪》引证目录；发现错误欢迎指正。
        </p>
      </main>
    </>
  );
}
