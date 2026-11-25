import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import PageIntro from '@/components/PageIntro';

export const metadata = {
  title: '页面不存在 · 紫微命盘',
};

const DESTINATIONS = [
  { href: '/chart', title: '排盘', desc: '输入生辰，排出命盘与十三主题解读' },
  { href: '/knowledge', title: '星曜知识', desc: '十四主星在十三宫的专题' },
  { href: '/library', title: '古籍', desc: '全文搜索与逐章阅读' },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[640px] px-4 sm:px-6 pb-24 pt-16 sm:pt-24">
        <PageIntro eyebrow="404" title="这一页不在盘上" className="mb-10">
          链接可能写错了，或者页面已经移走。可以从下面这几处继续。
        </PageIntro>
        <ul className="grid gap-3">
          {DESTINATIONS.map(d => (
            <li key={d.href}>
              <Link href={d.href} className="card-glass group flex items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5">
                <span>
                  <span className="block text-[15px] font-medium" style={{ color: 'var(--tx-0)' }}>{d.title}</span>
                  <span className="block text-[13px]" style={{ color: 'var(--tx-3)' }}>{d.desc}</span>
                </span>
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--ac)' }}>→</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[13px]">
          <Link href="/" className="underline underline-offset-4 decoration-[var(--ac-bdr)] hover:text-[var(--ac)]" style={{ color: 'var(--tx-2)' }}>
            回首页
          </Link>
        </p>
      </main>
    </>
  );
}
