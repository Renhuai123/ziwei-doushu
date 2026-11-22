import { gradText, type SectionProps } from './colors';
import { FadeIn, WeakBoundary } from './shared';

/** 首页 · 天·地·人三分理论 */
export default function TianDiRen({ c, theme }: SectionProps) {
  return (
    <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20"
      style={{ background: c.altSection, minHeight: '82svh' }}>
      <WeakBoundary line={c.navBorder} />
      <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
        <FadeIn>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
              <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Ni Haixia · Philosophy</span>
              <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
            </div>
            <h2 className={`${gradText(theme)} font-bold mb-5 tracking-tight`}
              style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
              天 · 地 · 人
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: c.textSecond }}>
              倪海厦老师的核心命运观：命运从来不是人生的全部。<br />
              他将影响人生的力量分为三个同等重要的维度。
            </p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { glyph: '天', label: '先天命运', pct: '⅓', color: c.goldSolid, borderColor: c.goldLine, desc: '紫微斗数所揭示的，是一个人的先天命盘格局——出生时间决定的星曜布局、五行局数、命宫主星。这只是命运的三分之一，是人生的底色，而非全貌。', sub: '命盘 · 星曜 · 五行' },
            { glyph: '地', label: '地理环境', pct: '⅓', color: 'rgba(96,165,250,0.9)', borderColor: 'rgba(96,165,250,0.3)', desc: '你所在的地理环境、城市、国家、风水格局，乃至家庭背景与社会结构，共同构成了命运的第二个维度。同一命盘，生在不同地方，际遇可以天壤之别。', sub: '地域 · 风水 · 环境' },
            { glyph: '人', label: '人心意念', pct: '⅓', color: 'rgba(100,216,139,0.9)', borderColor: 'rgba(100,216,139,0.3)', desc: '个人的意志、心态、选择与行动，才是改变命运最主动的力量。倪师强调：了解命盘是为了更好地做人，而不是坐等命运安排。精进自己，是最强的破局之道。', sub: '意志 · 选择 · 行动' },
          ].map((item, i) => (
            <FadeIn key={item.glyph} delay={0.1 + i * 0.12}>
              <div
                className="transition-transform duration-100 motion-safe:hover:-translate-y-1 rounded-2xl p-7 h-full flex flex-col"
                style={{ background: c.cardBg, border: `1px solid ${item.borderColor}`, boxShadow: c.cardShadow }}>
                <div className="flex items-start justify-between mb-5">
                  <div className="text-5xl font-bold leading-none" style={{ color: item.color }}>{item.glyph}</div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: item.color }}>{item.pct}</div>
                    <div className="text-[9px] mt-0.5 tracking-widest" style={{ color: c.textMuted }}>of life</div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-sm font-medium mb-0.5" style={{ color: item.color }}>{item.label}</div>
                  <div className="text-[10px] tracking-wider" style={{ color: c.textMuted }}>{item.sub}</div>
                </div>
                <div className="h-px mb-4" style={{ background: item.borderColor }} />
                <p className="text-xs leading-relaxed flex-1" style={{ color: c.textSecond }}>{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}>
          <div className="mt-10 text-center">
            <p className="text-sm leading-relaxed" style={{ color: c.textSecond }}>
              「命运不是人生的全部，加上地理位置和人念，才是。」
            </p>
            <p className="mt-2 text-[10px] tracking-widest" style={{ color: c.tagText }}>— 倪海厦</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
