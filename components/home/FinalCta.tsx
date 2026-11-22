'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { gradText, type SectionProps } from './colors';
import { FadeIn } from './shared';

/** 首页 · 页尾起盘入口与知识库、古籍链接 */
export default function FinalCta({ c, theme }: SectionProps) {
  const router = useRouter();
  return (
    <section className="relative z-10 py-40 px-6 text-center" style={{ background: c.altSection }}>
      <FadeIn>
        <p className="text-[10px] tracking-[0.6em] uppercase mb-6" style={{ color: c.tagText }}>开始你的命盘之旅</p>
        <h2 className={`${gradText(theme)} font-bold mb-8 tracking-tight leading-tight`}
          style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}>
          你的紫微命盘<br />等你解读
        </h2>
        <p className="text-sm mb-10 max-w-md mx-auto leading-relaxed" style={{ color: c.textSecond }}>
          输入出生年月日时，在几秒内生成你的专属命盘<br />
          再由 AI 按倪海厦体系为你深度解读
        </p>
        <button
          onClick={() => router.push('/chart')}
          className="transition-transform duration-150 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] px-14 py-4 font-semibold text-base tracking-widest rounded-full"
          style={{ background: c.ctaBg, color: c.ctaText }}>
          免费起盘
        </button>
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <Link
            href="/knowledge"
            className="transition-transform duration-150 motion-safe:hover:scale-[1.02] text-xs tracking-[0.2em] inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              color: c.goldSolid,
              border: `1px solid ${c.goldLine}`,
              background: 'transparent',
              textDecoration: 'none',
            }}>
            ✦ 紫微斗数知识库 →
          </Link>
          <Link
            href="/library"
            className="transition-transform duration-150 motion-safe:hover:scale-[1.02] text-xs tracking-[0.2em] inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              color: c.goldSolid,
              border: `1px solid ${c.goldLine}`,
              background: 'transparent',
              textDecoration: 'none',
            }}>
            📜 古籍原典库 →
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
