import Link from 'next/link';
import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import PageIntro from '@/components/PageIntro';

/** 隐私政策 / 服务条款共用的版式：站点页头 + 窄栏正文 + 互链。 */
export default function LegalPage({ title, updated, intro, other, children }: {
  title: string;
  updated: string;
  intro: ReactNode;
  other: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[720px] px-4 sm:px-6 pb-24 pt-10 sm:pt-14">
        <PageIntro eyebrow={`最后更新：${updated}`} title={title} className="mb-10">{intro}</PageIntro>
        <div className="legal-prose">{children}</div>
        <p className="mt-14 text-[13px]" style={{ color: 'var(--tx-3)' }}>
          <Link href={other.href} className="underline underline-offset-4 hover:text-[var(--ac)]">{other.label}</Link>
          <span aria-hidden> · </span>
          <Link href="/" className="underline underline-offset-4 hover:text-[var(--ac)]">返回首页</Link>
        </p>
      </main>
    </>
  );
}
