'use client';
import { useLayoutEffect } from 'react';
import StarField from '@/components/StarField';
import SiteHeader from '@/components/SiteHeader';
import { useTheme } from '@/components/ThemeProvider';
import { useColors } from '@/components/home/colors';
import Hero from '@/components/home/Hero';
import Philosophy from '@/components/home/Philosophy';
import Curriculum from '@/components/home/Curriculum';
import Features from '@/components/home/Features';
import TianDiRen from '@/components/home/TianDiRen';
import NiHaixia from '@/components/home/NiHaixia';
import HemingCta from '@/components/home/HemingCta';
import FinalCta from '@/components/home/FinalCta';
import HomeFooter from '@/components/home/HomeFooter';

/** 首页外壳：背景、星空与光晕、导航；各区块在 components/home/ 里。 */
export default function HomeView() {
  const { theme } = useTheme();
  const c = useColors(theme);

  // 把 body / html 背景同步到 home 主题色，消除半透明 nav 透出 #fafaf9 的色差
  // useLayoutEffect 保证在浏览器绘制前同步更新，避免与根 div 的 transition 不同步
  useLayoutEffect(() => {
    document.documentElement.style.background = c.bgBase;
    document.body.style.background = c.bgBase;
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [c.bgBase]);

  return (
    <div style={{ background: c.bgBase, transition: 'background 0.35s ease' }} className="overflow-x-hidden">
      <StarField />

      {/* 全局光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowTint} 0%, transparent 70%)` }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowBlue} 0%, transparent 70%)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowPurple} 0%, transparent 70%)` }} />
      </div>

      <SiteHeader />

      <main id="main">
        <Hero c={c} theme={theme} />
        <Philosophy c={c} theme={theme} />
        <Curriculum c={c} theme={theme} />
        <Features c={c} theme={theme} />
        <TianDiRen c={c} theme={theme} />
        <NiHaixia c={c} theme={theme} />
        <HemingCta c={c} theme={theme} />
        <FinalCta c={c} theme={theme} />
      </main>

      <HomeFooter c={c} theme={theme} />
    </div>
  );
}
