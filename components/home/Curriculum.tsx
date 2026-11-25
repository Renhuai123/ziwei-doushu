'use client';
import Reveal from '@/components/Reveal';
import { type SectionProps } from './colors';
import { FadeIn } from './shared';
import { SECTIONS } from './data';

/** 首页 · 天纪 / 地纪 / 人纪等四大学习板块时间轴 */
export default function Curriculum({ c, theme }: SectionProps) {
  return (
    <section className="relative z-10 py-20 lg:py-24 px-6"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(to bottom, transparent 0%, rgba(184,146,42,0.03) 50%, transparent 100%)'
          : 'linear-gradient(to bottom, transparent 0%, rgba(184,146,42,0.04) 50%, transparent 100%)',
      }}>
      <FadeIn className="text-center mb-14">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
          <span className="text-[10px] tracking-[0.4em] uppercase" style={{ color: c.goldSolid, opacity: 0.7 }}>Curriculum</span>
          <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold mb-2 tracking-[0.15em]" style={{ color: c.textPrimary }}>
          倪师方法论 · 渐次展开
        </h2>
        <div className="text-xs lg:text-sm tracking-[0.1em]" style={{ color: c.textMuted }}>
          从紫微入门，逐步开放天纪 / 地纪 / 人纪学习模块
        </div>
      </FadeIn>

      <div className="max-w-sm lg:max-w-5xl mx-auto relative">
        {/* 横向连接线（仅桌面）*/}
        <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5"
          style={{
            background: `linear-gradient(90deg, ${c.goldSolid} 0%, ${c.goldSolid} 25%, ${c.goldLine} 25%)`,
            opacity: 0.6,
          }} />

        {/* 纵向连接线（仅手机）—— 圆点贴在线上，做"地铁线路图"风格 */}
        <div className="lg:hidden absolute left-7 top-7 bottom-7 w-px -translate-x-1/2"
          style={{
            background: `linear-gradient(180deg, ${c.goldSolid} 0%, ${c.goldSolid} 22%, ${c.goldLine} 22%)`,
            opacity: 0.6,
          }} />

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-4 lg:gap-4">
          {SECTIONS.map((s, i) => {
            const ready = s.status === 'ready';
            return (
              <Reveal delay={i * 0.15} y={20} duration={0.5} key={s.key}
                className="relative flex flex-row lg:flex-col items-center lg:items-center text-left lg:text-center gap-4 lg:gap-0">
                {/* 节点圆 */}
                <div className="relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center lg:mb-3"
                  style={{
                    background: ready
                      ? `linear-gradient(135deg, ${c.goldSolid} 0%, ${c.goldSolid}cc 100%)`
                      : (theme === 'dark' ? 'rgba(184,146,42,0.05)' : '#fdf8ee'),
                    border: ready ? 'none' : `2px dashed ${c.goldLine}`,
                    color: ready ? '#fff' : c.textMuted,
                    boxShadow: ready ? `0 4px 16px ${c.goldSolid}55` : 'none',
                  }}>
                  <span className="text-2xl">{s.icon}</span>
                  {ready && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                      style={{ background: '#10b981', boxShadow: '0 2px 6px rgba(16,185,129,0.4)' }}>
                      ✓
                    </div>
                  )}
                </div>
                {/* 文字组：手机端右排单列；桌面端居中堆叠 */}
                <div className="flex-1 lg:flex-none flex flex-col items-start lg:items-center min-w-0">
                  {/* 顶行：时间标签 + 板块名 + note（手机端 inline；桌面端依然分行） */}
                  <div className="flex items-baseline gap-2 lg:flex-col lg:gap-0 lg:mb-1">
                    <div className="text-[10px] tracking-[0.25em] lg:mb-1.5"
                      style={{ color: ready ? '#10b981' : c.textMuted, fontWeight: 500 }}>
                      {s.when}
                    </div>
                    <div className="text-base lg:text-xl font-semibold tracking-[0.15em]"
                      style={{ color: c.textPrimary }}>
                      {s.name}
                    </div>
                    {s.note && (
                      <div className="text-[9px] tracking-[0.15em] px-2 py-0.5 rounded-full lg:hidden"
                        style={{
                          color: c.goldSolid,
                          background: theme === 'dark' ? 'rgba(184,146,42,0.1)' : 'rgba(184,146,42,0.08)',
                          border: `1px solid ${c.goldLine}`,
                          opacity: 0.85,
                        }}>
                        {s.note}
                      </div>
                    )}
                  </div>
                  {/* 桌面专属 note（手机已在顶行 inline 展示）*/}
                  {s.note && (
                    <div className="hidden lg:block text-[9px] tracking-[0.15em] mb-1.5 px-2 py-0.5 rounded-full"
                      style={{
                        color: c.goldSolid,
                        background: theme === 'dark' ? 'rgba(184,146,42,0.1)' : 'rgba(184,146,42,0.08)',
                        border: `1px solid ${c.goldLine}`,
                        opacity: 0.85,
                      }}>
                      {s.note}
                    </div>
                  )}
                  {/* 简介 */}
                  <div className="text-[11px] lg:text-xs leading-relaxed lg:max-w-[200px] mt-0.5 lg:mt-0"
                    style={{ color: c.textSecond }}>
                    {s.desc}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
