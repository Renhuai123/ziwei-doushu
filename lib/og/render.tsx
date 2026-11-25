/**
 * 分享预览图的共用部件。只在构建期由 opengraph-image / icon 路由调用（静态生成）。
 * 配色取自 globals.css 暗色主题：--bg-0 #020810、--bg-1 #0a1020、--ac #d4a843、--tx-0 #e8eef6、--tx-2 #9db0d0。
 */
import { readFile } from 'node:fs/promises';
import { GRID_BRANCHES, ICON_GLYPH } from './text';

export const C = {
  bg0: '#020810',
  bg1: '#0a1020',
  ac: '#d4a843',
  acBg: 'rgba(212,168,67,0.10)',
  acBdr: 'rgba(212,168,67,0.35)',
  tx0: '#e8eef6',
  tx2: '#9db0d0',
  tx3: '#6a7a96',
  bdr: 'rgba(255,255,255,0.10)',
};

export async function ogFonts() {
  // 用 import.meta.url 定位，打包器能追踪到字体文件（按需渲染时也在产物里）
  const [regular, bold] = await Promise.all([
    readFile(new URL('./fonts/NotoSansSC-Regular.subset.otf', import.meta.url)),
    readFile(new URL('./fonts/NotoSansSC-Bold.subset.otf', import.meta.url)),
  ]);
  return [
    { name: 'Noto Sans SC', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Noto Sans SC', data: bold, weight: 700 as const, style: 'normal' as const },
  ];
}

function Cell({ label, size }: { label: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
      padding: 10, border: `1px solid ${C.bdr}`, background: 'rgba(255,255,255,0.02)',
      color: C.tx3, fontSize: Math.round(size * 0.2),
    }}>
      {label}
    </div>
  );
}

/** 传统 4×4 命盘外框：外圈十二宫标地支，中间 2×2 放 center。 */
export function ChartGrid({ size, center }: { size: number; center: React.ReactNode }) {
  const cell = (size - 2) / 4; // 外框 1px × 2
  const { top, right, bottom, left } = GRID_BRANCHES;
  return (
    <div style={{ width: size, height: size, display: 'flex', flexDirection: 'column', border: `1px solid ${C.acBdr}` }}>
      <div style={{ display: 'flex' }}>{top.map(b => <Cell key={b} label={b} size={cell} />)}</div>
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>{left.map(b => <Cell key={b} label={b} size={cell} />)}</div>
        <div style={{
          width: cell * 2, height: cell * 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.acBg,
        }}>
          {center}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>{right.map(b => <Cell key={b} label={b} size={cell} />)}</div>
      </div>
      <div style={{ display: 'flex' }}>{bottom.map(b => <Cell key={b} label={b} size={cell} />)}</div>
    </div>
  );
}

/** 1200×630 画布：左文右盘。 */
export function OgFrame({ children, grid }: { children: React.ReactNode; grid: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 80px', fontFamily: 'Noto Sans SC', color: C.tx0,
      background: `radial-gradient(circle at 78% 50%, ${C.bg1} 0%, ${C.bg0} 70%)`,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 600 }}>{children}</div>
      {grid}
    </div>
  );
}

export function Eyebrow({ children }: { children: string }) {
  return <div style={{ display: 'flex', color: C.ac, fontSize: 26, letterSpacing: 4, marginBottom: 24 }}>{children}</div>;
}

/** 站点图标画法（icon.tsx / apple-icon.tsx 共用）。 */
export function renderIcon(px: number, radius: number) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg0, borderRadius: radius, border: `${Math.max(1, px / 32)}px solid ${C.acBdr}`,
      color: C.ac, fontFamily: 'Noto Sans SC', fontWeight: 700, fontSize: px * 0.62,
    }}>
      {ICON_GLYPH}
    </div>
  );
}
