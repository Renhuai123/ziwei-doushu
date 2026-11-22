import { type SectionProps } from './colors';
import { SECTIONS } from './data';

/** 首页 · 页脚：板块导航与免责声明 */
export default function HomeFooter({ c }: SectionProps) {
  return (
    <footer className="relative z-10 py-10 px-6"
      style={{ borderTop: `1px solid ${c.niCardBord}` }}>

      {/* 4 板块导航占位（已上线 + 即将开放）*/}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-[9px] tracking-[0.3em] text-center mb-4 uppercase"
          style={{ color: c.textMuted, opacity: 0.6 }}>
          倪师方法论 · 学术体系
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {SECTIONS.map(s => {
            const ready = s.status === 'ready';
            return (
              <a
                key={s.key}
                href={ready ? '/chart' : undefined}
                onClick={ready ? undefined : (e) => e.preventDefault()}
                className="rounded-lg px-3 py-3 text-center transition-all"
                style={{
                  background: ready ? c.starBg : 'transparent',
                  border: `1px ${ready ? 'solid' : 'dashed'} ${ready ? c.goldLine : c.navBorder}`,
                  cursor: ready ? 'pointer' : 'not-allowed',
                  opacity: ready ? 1 : 0.5,
                  textDecoration: 'none',
                }}
              >
                <div className="text-base font-semibold mb-0.5 tracking-[0.1em]"
                  style={{ color: ready ? c.goldSolid : c.textMuted }}>
                  {s.name}
                </div>
                <div className="text-[9px] tracking-wider"
                  style={{ color: ready ? '#10b981' : c.textMuted }}>
                  {ready ? '✓ 已上线' : s.when}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] tracking-wider mb-3" style={{ color: c.footerText }}>
          紫微命盘 · 基于倪海厦正宗体系 · 仅供参考，命运掌握在自己手中
        </p>
        <p className="text-[10px] tracking-wider mb-3 max-w-2xl mx-auto leading-relaxed"
          style={{ color: c.footerText, opacity: 0.85 }}>
          本平台基于中国传统文化研究，仅提供学习参考。<br className="sm:hidden" />
          不构成任何医疗、投资、法律或重大决策建议。
        </p>
        <p className="text-[10px] tracking-wider" style={{ color: c.footerText }}>
          <a href="/terms" style={{ color: c.footerText, textDecoration: 'underline' }}>服务条款</a>
          {' · '}
          <a href="/privacy" style={{ color: c.footerText, textDecoration: 'underline' }}>隐私政策</a>
        </p>
      </div>
    </footer>
  );
}
