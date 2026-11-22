'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/**
 * 首页动画（取代 framer-motion）。
 * - enter()：页面载入即播放的进场动画，返回带 CSS 变量的 style，配合 className="enter"。
 * - <Reveal>：滚动到视口时播放一次（IntersectionObserver），配合 globals.css 的 .reveal。
 * 两者在 prefers-reduced-motion 下都直接显示终态。
 */

type Motion = { x?: number; y?: number; scale?: number; duration?: number };

const vars = (prefix: string, delay: number, { x = 0, y = 0, scale = 1, duration = 0.6 }: Motion) => ({
  [`--${prefix}-x`]: `${x}px`,
  [`--${prefix}-y`]: `${y}px`,
  [`--${prefix}-scale`]: String(scale),
  [`--${prefix}-dur`]: `${duration}s`,
  [`--${prefix}-delay`]: `${delay}s`,
}) as CSSProperties;

export const enter = (delay = 0, motion: Motion = {}) => vars('enter', delay, motion);

type RevealProps = Motion & {
  children: ReactNode;
  delay?: number;
  /** IntersectionObserver rootMargin，负值表示进入视口多少后才触发 */
  margin?: string;
  as?: 'div' | 'p';
  className?: string;
  style?: CSSProperties;
};

export default function Reveal({ children, delay = 0, margin = '0px', as: Tag = 'div', className = '', style, ...motion }: RevealProps) {
  const ref = useRef<HTMLDivElement & HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { el.dataset.in = ''; return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.dataset.in = ''; io.disconnect(); }
    }, { rootMargin: `${margin} 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);

  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ ...vars('reveal', delay, motion), ...style }}>
      {children}
    </Tag>
  );
}
