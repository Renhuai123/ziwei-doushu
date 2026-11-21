'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { href: '/chart', label: '排盘' },
  { href: '/heming', label: '合盘' },
  { href: '/knowledge', label: '星曜知识' },
  { href: '/library', label: '古籍' },
] as const;

/** 内页共用顶栏：左侧字标回首页，中间主导航，右侧主题切换。 */
export default function SiteHeader() {
  const pathname = usePathname() ?? '';
  return (
    <header className="app-bar">
      <a href="#main" className="skip-link">跳到正文</a>
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 sm:gap-4 px-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="紫微命盘首页">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-full text-[13px]"
            style={{ border: '1px solid var(--ac-bdr)', color: 'var(--ac)', background: 'var(--ac-bg)' }}
          >
            紫
          </span>
          <span className="hidden sm:inline text-[13px] font-medium tracking-[0.3em]" style={{ color: 'var(--tx-0)' }}>
            紫微命盘
          </span>
        </Link>
        <nav aria-label="主导航" className="flex min-w-0 items-center gap-0.5 sm:gap-1 sm:ml-4 overflow-x-auto">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-link shrink-0"
              aria-current={pathname.startsWith(l.href) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
