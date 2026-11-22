'use client';
import Reveal from '@/components/Reveal';
import { gradText, type SectionProps } from './colors';
import { FadeIn, WeakBoundary } from './shared';

/** 首页 · 哲学引言 */
export default function Philosophy({ c, theme }: SectionProps) {
  return (
    <section className="relative z-10 overflow-hidden min-h-[82svh] lg:min-h-[92vh] flex items-center" style={{ padding: '72px 24px' }}>
      <WeakBoundary line={c.navBorder} />
      <div className="absolute inset-0"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, #020810 0%, #020810 6%, #030a18 22%, #0d0820 40%, #0a0618 68%, #030a18 86%, #020810 100%)'
            : 'linear-gradient(to bottom, #f5efe0 0%, #f5efe0 6%, #c08055 18%, #6a2810 32%, #1e0a02 50%, #1e0a02 70%, #6a2810 84%, #f5efe0 100%)',
          transition: 'background 0.4s ease',
        }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="font-bold" style={{ fontSize: 'clamp(220px, 38vw, 460px)', color: 'rgba(212,168,67,0.012)', lineHeight: 1, fontFamily: 'serif' }}>命</span>
      </div>
      <FadeIn className="relative mx-auto text-center w-full" y={20}>
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.45))' }} />
          <span className="text-[10px] tracking-[0.55em] uppercase" style={{ color: 'rgba(212,168,67,0.5)' }}>命 · 运 · 观</span>
          <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(212,168,67,0.45))' }} />
        </div>
        <div className="space-y-3" style={{ maxWidth: '840px', margin: '0 auto' }}>
          {[
            { text: '提前窥探命运的意义', size: 'clamp(17px, 2.2vw, 28px)', color: 'rgba(215,228,252,0.72)', delay: 0.1 },
            { text: '不在于预知未来', size: 'clamp(21px, 2.6vw, 32px)', color: 'rgba(220,232,250,0.74)', delay: 0.25 },
            { text: '而在于不断认识自己', size: 'clamp(24px, 3vw, 40px)', color: 'rgba(218,230,248,0.8)', delay: 0.34 },
          ].map((line, i) => (
            <Reveal as="p" delay={line.delay} y={16} duration={0.7} key={i}
              className="tracking-wider" style={{ fontSize: line.size, color: line.color, fontWeight: 400 }}>
              {line.text}
            </Reveal>
          ))}
          <Reveal as="p" delay={0.45} y={20} duration={0.8}
            className={`${gradText(theme)} font-bold`}
            style={{ fontSize: 'clamp(24px, 3.4vw, 48px)', letterSpacing: '0.05em', lineHeight: 1.35 }}>
            最终书写属于自己的人生剧本
          </Reveal>
        </div>
      </FadeIn>
    </section>
  );
}
