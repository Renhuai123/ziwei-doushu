import { gradText, type SectionProps } from './colors';
import { FadeIn, WeakBoundary } from './shared';
import { NI_TEACHINGS } from './data';

/** 首页 · 倪海厦介绍与核心教义 */
export default function NiHaixia({ c, theme }: SectionProps) {
  return (
    <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20" style={{ minHeight: '82svh' }}>
      <WeakBoundary line={c.navBorder} />
      <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
        <FadeIn>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
              <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Master · 1953 – 2012</span>
              <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
            </div>
            <h2 className={`${gradText(theme)} font-bold mb-6 tracking-tight`}
              style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
              倪海厦老师
            </h2>
            <p className="max-w-2xl mx-auto leading-relaxed text-sm" style={{ color: c.textSecond }}>
              当代华人圈最具影响力的中医与术数大家之一<br />
              美国汉唐中医学院创办人 ·「人纪」「天纪」两大教学体系传世
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="rounded-2xl p-8 md:p-10 mb-8"
            style={{ border: `1px solid ${c.niBorder}`, background: c.niBg, boxShadow: c.cardShadow }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: '生于', value: '1954年', sub: '台湾' },
                { label: '离世', value: '2012年', sub: '1月31日 · 享年58' },
                { label: '传承', value: '紫微斗数', sub: '经方中医 · 易经' },
              ].map(item => (
                <div key={item.label} className="text-center rounded-xl px-4 py-3"
                  style={{ border: `1px solid ${c.niDivider}`, background: 'rgba(255,255,255,0.02)' }}>
                  <div className="text-[10px] tracking-[0.3em] mb-1" style={{ color: c.textFaint }}>{item.label}</div>
                  <div className="text-2xl font-semibold mb-0.5" style={{ color: c.goldSolid }}>{item.value}</div>
                  <div className="text-[11px]" style={{ color: c.textMuted }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="h-px mb-8" style={{ background: c.niDivider }} />
            <div className="space-y-4 text-sm leading-relaxed max-w-3xl mx-auto" style={{ color: c.textSecond }}>
              <p>
                <strong style={{ color: c.goldSolid }}>生平履历</strong>：
                倪海厦先生（1954–2012）出生于台湾，早年师承多位中医名家，专研经方派（《伤寒论》传承）。
                中年赴美行医，在美国创立<strong>汉唐中医学院</strong>，二十余年间系统传授中医与传统术数。
                2012 年 1 月 31 日因肝癌在台湾离世，享年 58 岁。
              </p>
              <p>
                <strong style={{ color: c.goldSolid }}>教学体系</strong>：
                倪师将毕生所学整理为两大公开教学系列。
                <strong>「人纪」</strong>涵盖《针灸大成》《神农本草经》《黄帝内经》《伤寒论》《金匮要略》——
                这是「人之纪」，奠定中医学习的完整路径；
                <strong>「天纪」</strong>涵盖紫微斗数与《易经》——这是「天之纪」，是术数研究的体系化成果。
                两者相合，是倪师留给后世最完整的传承。
              </p>
              <p>
                <strong style={{ color: c.goldSolid }}>紫微立场</strong>：
                倪师在紫微斗数上明确属<strong>南派三合派</strong>，主张「以命宫为本、以三方四正为用、以四化为纲」。
                他在《天纪》课程中明言：「<em>飞星（四化）飞来飞去太复杂，不搞这个，毕竟大道至简</em>」——
                这一立场将其与繁琐的飞星派清晰区分。
              </p>
              <p>
                <strong style={{ color: c.goldSolid }}>治学态度</strong>：
                倪师反对死记硬背口诀，强调「理解原理胜过背诵」「逻辑可复核胜过神秘玄学」。
                这种态度让紫微斗数从师徒密传的封闭体系，走向系统化、可验证、可学习的现代知识体系。
              </p>
              <p>
                <strong style={{ color: c.goldSolid }}>当代影响</strong>：
                倪师的讲课视频在 B 站、YouTube 与各大平台广泛流传，是新一代命理与中医爱好者公认的入门必修。
                他不仅是紫微斗数的传承者，更是把传统命理与中医带入现代知识体系的关键人物之一。
              </p>
              <p style={{ fontSize: '11px', color: c.textMuted, fontStyle: 'italic', marginTop: '12px' }}>
                本平台所有解读基于倪师《天纪》公开教学讲义、《紫微斗数全书》明版、传统三合派古籍整理而成，
                仅作文化与个人成长参考。倪师本人与本平台无任何商业关联。
              </p>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NI_TEACHINGS.map((teaching, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.08}>
              <div
                className="transition-transform duration-100 motion-safe:hover:-translate-y-[3px] rounded-xl p-6 h-full"
                style={{ border: `1px solid ${c.niCardBord}`, background: c.niCardBg, boxShadow: c.niCardShadow }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5"
                    style={{ borderColor: c.goldLine }}>
                    <span className="text-[9px]" style={{ color: c.goldSolid }}>{i + 1}</span>
                  </div>
                  <h3 className="text-sm font-medium leading-relaxed" style={{ color: c.goldSolid }}>{teaching.title}</h3>
                </div>
                <p className="text-xs leading-relaxed pl-8" style={{ color: c.textSecond }}>{teaching.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
