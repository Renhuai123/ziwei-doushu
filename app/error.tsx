'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

/** 路由段渲染出错时的兜底页：给出重试，不把用户丢在空白页上。 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[640px] px-4 sm:px-6 pb-24 pt-16 sm:pt-24">
        <p className="eyebrow mb-4">出错了</p>
        <h1 className="text-[28px] sm:text-[34px] font-semibold leading-tight mb-3" style={{ color: 'var(--tx-0)' }}>
          这一页没能加载出来
        </h1>
        <p className="text-[15px] leading-relaxed mb-8" style={{ color: 'var(--tx-2)' }}>
          多半是网络一时不稳。可以重试一次；如果反复出现，换个时间再来。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-full px-6 text-[14px] font-semibold"
            style={{ background: 'var(--ac)', color: 'var(--bg-0)' }}
          >
            重试
          </button>
          <Link href="/" className="chip !h-11 !px-5">回首页</Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-[12px] font-mono" style={{ color: 'var(--tx-3)' }}>错误编号：{error.digest}</p>
        )}
      </main>
    </>
  );
}
