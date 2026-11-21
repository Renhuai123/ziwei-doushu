'use client';
import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const isLight = theme === 'light';
    const count = isLight ? 120 : 200;

    type Particle = {
      x: number; y: number; r: number;
      alpha: number; alphaDir: number; speed: number;
    };

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: isLight ? Math.random() * 1.5 + 0.3 : Math.random() * 1.2 + 0.2,
      alpha: Math.random(),
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      speed: Math.random() * 0.004 + 0.002,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.alpha += p.alphaDir * p.speed;
        if (p.alpha >= 1) { p.alpha = 1; p.alphaDir = -1; }
        if (p.alpha <= 0) { p.alpha = 0; p.alphaDir = 1; }

        const color = isLight
          ? `rgba(160, 110, 20, ${p.alpha})`   // 亮色: 金色尘埃
          : `rgba(200, 220, 255, ${p.alpha})`;  // 暗色: 蓝白星光

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  return (
    <canvas
      aria-hidden
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: theme === 'light' ? 0.3 : 0.6 }}
    />
  );
}
