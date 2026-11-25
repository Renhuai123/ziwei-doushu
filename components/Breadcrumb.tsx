import Link from 'next/link';

export interface Crumb {
  label: string;
  /** 不给 href 的一项是当前页 */
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="面包屑" className="mb-8 flex flex-wrap items-center gap-x-2 text-[13px]" style={{ color: 'var(--tx-3)' }}>
      {items.map((c, i) => (
        <span key={i} className="contents">
          {i > 0 && <span aria-hidden>/</span>}
          {c.href
            ? <Link href={c.href} className="hover:text-[var(--tx-0)]">{c.label}</Link>
            : <span aria-current="page" style={{ color: 'var(--tx-1)' }}>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}
