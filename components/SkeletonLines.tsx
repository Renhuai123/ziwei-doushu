/** 加载占位：几条宽度不一的灰条。 */
export default function SkeletonLines({ widths, label, thin }: { widths: number[]; label: string; thin?: boolean }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      {widths.map((w, i) => (
        <div key={i} className={`${thin ? 'h-2.5' : 'h-3'} rounded-full animate-pulse`} style={{ width: `${w}%`, background: 'var(--bg-2)' }} />
      ))}
    </div>
  );
}
