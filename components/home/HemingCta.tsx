'use client';
import { useRouter } from 'next/navigation';
import { gradText, type SectionProps } from './colors';
import { FadeIn } from './shared';

/** 首页 · 合盘入口 */
export default function HemingCta({ c, theme }: SectionProps) {
  const router = useRouter();
  return (
    <section className="relative z-10 px-6 md:px-10 lg:px-14 py-20">
      <div className="mx-auto" style={{ maxWidth: '1280px' }}>
        <div className="rounded-2xl p-10 md:p-14 text-center"
          style={{
            background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
            border: `1px solid ${c.cardBorder}`,
            boxShadow: c.cardShadow,
          }}>
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-8" style={{ background: c.goldLine }} />
              <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Compatibility · Analysis</span>
              <div className="h-px w-8" style={{ background: c.goldLine }} />
            </div>
            <h2 className={`${gradText(theme)} font-bold mb-4 tracking-tight`}
              style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
              紫微合盘
            </h2>
            <p className="text-sm leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: c.textSecond }}>
              输入两个人的出生信息，AI 基于倪海厦体系分析夫妻宫互参、命宫兼容性与三方四正交互，<br className="hidden md:block" />
              给出感情匹配度、合伙可行性与最佳相处建议。
            </p>
            <div className="flex justify-center gap-3 flex-wrap mb-6">
              {['感情匹配度分析', '合伙创业评估', '亲子缘分解读', '婚前相性评估'].map(item => (
                <span key={item} style={{
                  fontSize: '12px', padding: '5px 14px', borderRadius: '20px',
                  background: theme === 'dark' ? 'rgba(212,168,67,0.08)' : 'rgba(212,168,67,0.12)',
                  border: `1px solid ${c.goldLine}`,
                  color: c.goldSolid,
                }}>
                  {item}
                </span>
              ))}
            </div>
            <button
              onClick={() => router.push('/heming')}
              className="transition-transform duration-150 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] px-10 py-3 font-medium text-sm tracking-widest rounded-full"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(140,100,20,0.1)',
                border: `1px solid ${c.goldLine}`,
                color: c.goldSolid,
                cursor: 'pointer',
              }}>
              开始合盘分析
            </button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
