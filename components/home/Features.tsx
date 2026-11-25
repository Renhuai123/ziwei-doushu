import { gradText, type SectionProps } from './colors';
import { FadeIn } from './shared';
import { FEATURES } from './data';
import FeatureVisual from './FeatureVisual';

/** 首页 · 四个功能详解（文字 + 演示） */
export default function Features({ c, theme }: SectionProps) {
  return (
    <section className="relative z-10">
      {FEATURES.map((feature, i) => (
        <div key={i}
          className={`flex items-center px-6 md:px-10 lg:px-14 py-20 md:py-24 ${i <= 2 ? 'min-h-[82svh] lg:min-h-[92vh]' : ''}`}
          style={{ background: i % 2 === 1 ? c.altSection : 'transparent' }}>
          <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
            <div className={`grid grid-cols-1 ${i % 2 === 0 ? 'lg:grid-cols-[0.45fr_0.55fr]' : 'lg:grid-cols-[0.55fr_0.45fr]'} gap-10 lg:gap-16 items-start ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
              {/* 文字区 */}
              <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                <FadeIn delay={0}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-8" style={{ background: c.goldLine }} />
                    <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>{feature.tag}</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <h2 className={`${gradText(theme)} font-bold leading-tight mb-5 tracking-tight`}
                    style={{
                      fontSize: i < 2 ? 'clamp(36px, 4vw, 56px)' : 'clamp(30px, 3.5vw, 48px)',
                      whiteSpace: 'pre-line',
                    }}>
                    {feature.title}
                  </h2>
                </FadeIn>
                <FadeIn delay={0.2}>
                  <p className="text-base mb-8 leading-relaxed" style={{ color: c.textSecond }}>{feature.subtitle}</p>
                </FadeIn>
                <div className="space-y-4">
                  {feature.points.map((point, j) => (
                    <FadeIn key={j} delay={0.25 + j * 0.08}>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-2 w-1 h-1 rounded-full" style={{ background: c.goldSolid, opacity: 0.6 }} />
                        <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{point}</p>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
              {/* 视觉装饰区 */}
              <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                <FadeIn delay={0.15}>
                  <div className="relative rounded-2xl overflow-hidden p-8 md:p-12"
                    style={{
                      border: `1px solid ${c.featureBord}`,
                      background: c.featureBg,
                      minHeight: i <= 1 ? '540px' : i === 2 ? '460px' : '320px',
                      boxShadow: c.cardShadow,
                    }}>
                    <FeatureVisual index={i} colors={c} />
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
