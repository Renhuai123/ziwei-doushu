'use client';
import { useRouter } from 'next/navigation';
import { enter } from '@/components/Reveal';
import { gradText, type SectionProps } from './colors';
import { STARS } from './data';

/** 首页 · 首屏：标题、标语、立即起盘、十四主星 */
export default function Hero({ c, theme }: SectionProps) {
  const router = useRouter();
  return (
    <section className="relative min-h-[82svh] lg:min-h-[92vh] flex flex-col items-center justify-center px-6 z-10 pb-24 pt-10">
      <div style={{ maxWidth: '960px' }} className="hero-parallax text-center w-full mx-auto mt-10">
        {/* 标签行 */}
        <div style={enter(0.1, { y: 16, duration: 0.6 })}
          className="enter flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
          <span className="text-[11px] tracking-[0.45em] transition-colors duration-300" style={{ color: c.tagText }}>
            紫微斗数 · 倪海厦体系
          </span>
          <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
        </div>

        {/* 主标题 */}
        <div className="enter"
          style={{ ...enter(0.2, { y: 24, duration: 0.9 }), position: 'relative', display: 'inline-block' }}>
          <h1
            className={`${gradText(theme)} font-bold leading-none mb-5`}
            style={{
              fontSize: 'clamp(56px, 10vw, 124px)',
              letterSpacing: '0.07em',
            }}>
            紫微命盘
          </h1>
        </div>

        <p
          className="enter text-base md:text-lg tracking-[0.18em] mb-2"
          style={{ ...enter(0.45, { y: 16, duration: 0.7 }), color: c.textSecond, fontWeight: 500 }}>
          紫微为门 · 天地人为路 · 倪海厦为师
        </p>
        <p
          className="enter text-xs md:text-sm tracking-[0.3em] mb-6"
          style={{ ...enter(0.55, { duration: 0.7 }), color: c.textMuted, opacity: 0.85 }}>
          AI 答疑 · 知行合一
        </p>
        <p
          className="enter text-sm max-w-xl mx-auto leading-relaxed mb-10"
          style={{ ...enter(0.65, { duration: 0.7 }), color: c.textMuted }}>
          输入出生年月日时，生成专属紫微斗数命盘 — 后续天纪、地纪、人纪学习模块陆续开放。
        </p>

        {/* CTA */}
        <div style={enter(0.85, { y: 12, duration: 0.6 })}
          className="enter flex flex-col items-center gap-4">
          <button
            onClick={() => router.push('/chart')}
            className="transition-[transform,filter] duration-150 hover:brightness-[1.06] motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97] px-12 py-4 font-semibold text-base tracking-widest rounded-full"
            style={{ background: c.ctaBg, color: c.ctaText }}>
            立即起盘
          </button>
        </div>

        {/* 十四主星 */}
        <div style={enter(1.05, { duration: 0.8 })}
          className="enter mt-12 grid grid-cols-7 gap-1.5 max-w-[540px] mx-auto">
          {STARS.map((star, i) => (
            <div key={star.name}
              className="enter flex items-center justify-center px-2 py-1 rounded-full"
              style={{ ...enter(1.05 + i * 0.03, { scale: 0.9, duration: 0.35 }), background: c.starBg, border: `1px solid ${c.starBorder}` }}>
              <span className="text-[11px] tracking-wide" style={{ color: c.starText }}>{star.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 滚动提示（绝对定位，不影响 hero opacity 计算） */}
      <div style={enter(2, { duration: 1 })}
        className="enter absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-[9px] tracking-[0.4em] uppercase" style={{ color: c.scrollText }}>探索更多</span>
        <div
          className="float-y w-px h-8" style={{ background: `linear-gradient(to bottom, ${c.scrollLine}, transparent)` }} />
      </div>
    </section>
  );
}
