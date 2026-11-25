/** 内页顶部的标题区：金色小标 + 大标题 + 一段导语。 */
export default function PageIntro({ eyebrow, title, children, className = 'mb-10' }: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={`max-w-[640px] ${className}`}>
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h1
        className="text-[28px] sm:text-[34px] font-semibold leading-tight mb-3"
        style={{ color: 'var(--tx-0)', textWrap: 'balance' }}
      >
        {title}
      </h1>
      {children && <p className="text-[15px] leading-relaxed" style={{ color: 'var(--tx-2)' }}>{children}</p>}
    </header>
  );
}
