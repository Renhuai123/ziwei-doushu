'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lunar, LunarMonth, Solar } from 'lunar-javascript';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { getHoroscope } from '@/lib/ziwei/horoscope';
import { CHILDHOOD_DAXIAN_INDEX, getChildhoodYears, getDaXianIndexForYear, getDaXianYears } from '@/lib/ziwei/yunxian-context';
import PalaceCell from './PalaceCell';
import TimeNav, { type TimeView } from './TimeNav';

interface ChartBoardProps {
  chart: ZiweiChart;
  onStarSelect?: (star: Star, palace: Palace) => void;
  onPalaceSelect?: (palace: Palace) => void;
  onSiHuaClick?: (starName: string, siHua: string, view: TimeView) => void;
}

const BRANCH_GRID_POS: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

const DIRECTIONS = ['正北', '北偏东', '东偏北', '正东', '东偏南', '南偏东',
  '正南', '南偏西', '西偏南', '正西', '西偏北', '北偏西'];

// 每个地支宫位在网格中的中心坐标（百分比）
const BRANCH_SVG_POS: Record<number, [number, number]> = {
  5: [12.5, 12.5], 6: [37.5, 12.5], 7: [62.5, 12.5], 8: [87.5, 12.5],
  4: [12.5, 37.5],                                      9: [87.5, 37.5],
  3: [12.5, 62.5],                                     10: [87.5, 62.5],
  2: [12.5, 87.5], 1: [37.5, 87.5], 0: [62.5, 87.5], 11: [87.5, 87.5],
};

// 绕盘面顺时针排列（用于三方四正四边形排序）
const CLOCKWISE_INDEX: Record<number, number> = {
  5: 0, 6: 1, 7: 2, 8: 3,
  9: 4, 10: 5,
  11: 6, 0: 7, 1: 8, 2: 9,
  3: 10, 4: 11,
};

function sortClockwise(branches: number[]): number[] {
  return [...branches].sort((a, b) => CLOCKWISE_INDEX[a] - CLOCKWISE_INDEX[b]);
}

/** 三方四正：本宫 + 对宫 + 两个三合宫 */
function getSanFangSiZheng(branch: number): [number, number, number, number] {
  return [
    branch,
    (branch + 6) % 12,   // 对宫
    (branch + 4) % 12,   // 三合1
    (branch + 8) % 12,   // 三合2
  ];
}

const ANIMATION_ORDER = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

export default function ChartBoard({ chart, onStarSelect, onPalaceSelect, onSiHuaClick }: ChartBoardProps) {
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [timeView, setTimeView] = useState<TimeView>('mingpan');
  const [initial] = useState(() => {
    const now = new Date();
    const lunar = Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate()).getLunar();
    const currentYear = Number(lunar.getYear());
    const dx = getDaXianIndexForYear(chart, currentYear);
    const childhood = getChildhoodYears(chart);
    const selected = dx >= 0 ? dx : childhood.includes(currentYear) ? CHILDHOOD_DAXIAN_INDEX : 0;
    const years = selected === CHILDHOOD_DAXIAN_INDEX ? childhood : getDaXianYears(chart, selected);
    return { currentYear, selected, year: years.includes(currentYear) ? currentYear : (years[0] ?? currentYear), month: Math.abs(Number(lunar.getMonth())), day: Number(lunar.getDay()), hour: Math.floor(((now.getHours() + 1) % 24) / 2) };
  });
  const [selectedDaXian, setSelectedDaXian] = useState(initial.selected);
  const [liunianYear, setLiunianYear] = useState(initial.year);
  const [lunarMonth, setLunarMonth] = useState(initial.month);
  const [lunarDay, setLunarDay] = useState(initial.day);
  const [hour, setHour] = useState(initial.hour);

  const palaceMap: Record<number, Palace> = {};
  chart.palaces.forEach(p => { palaceMap[p.branch] = p; });

  const dayCount = Number(LunarMonth.fromYm(liunianYear, lunarMonth)?.getDayCount() ?? 30);
  const safeDay = Math.min(lunarDay, dayCount);
  const solar = Lunar.fromYmd(liunianYear, lunarMonth, safeDay).getSolar();
  const solarYear = Number(solar.getYear());
  const solarMonth = Number(solar.getMonth());
  const solarDay = Number(solar.getDay());
  const isMingpan = timeView === 'mingpan';
  const layers = useMemo(() => isMingpan ? null : getHoroscope(chart.birthInfo, {
    year: solarYear, month: solarMonth, day: solarDay, hour,
  }, chart), [chart, isMingpan, solarYear, solarMonth, solarDay, hour]);
  const layer = timeView === 'mingpan' ? undefined : layers?.[timeView];
  const overlayData: Record<string, string> = {};
  if (layer) for (const [siHua, star] of Object.entries(layer.siHua)) overlayData[star] = siHua;
  const overlayLabel = ({ mingpan: '', daxian: '限', xiaoxian: '小', liunian: '年', liuyue: '月', liuri: '日', liushi: '时' } as const)[timeView];

  const changeDaXian = (index: number) => {
    const years = index === CHILDHOOD_DAXIAN_INDEX ? getChildhoodYears(chart) : getDaXianYears(chart, index);
    setSelectedDaXian(index);
    setLiunianYear(years.includes(initial.currentYear) ? initial.currentYear : years[0]);
    setTimeView('daxian');
  };

  const handlePalaceClick = (branch: number) => {
    const isDeselecting = selectedBranch === branch;
    setSelectedBranch(prev => prev === branch ? null : branch);
    if (!isDeselecting) {
      const palace = palaceMap[branch];
      if (palace) onPalaceSelect?.(palace);
    }
  };

  // 三方四正
  const sanFangBranches = selectedBranch !== null ? getSanFangSiZheng(selectedBranch) : null;
  const sanFangSet = sanFangBranches ? new Set(sanFangBranches) : null;

  return (
    <div className="w-full select-none">
      {/* 时间导航轴 */}
      <TimeNav
        chart={chart}
        view={timeView}
        selectedDaXian={selectedDaXian}
        year={liunianYear}
        month={lunarMonth}
        day={safeDay}
        hour={hour}
        dayCount={dayCount}
        layer={layer}
        onViewChange={setTimeView}
        onDaXianChange={changeDaXian}
        onYearChange={year => { setLiunianYear(year); setLunarDay(Math.min(safeDay, Number(LunarMonth.fromYm(year, lunarMonth)?.getDayCount() ?? 30))); setTimeView('liunian'); }}
        onMonthChange={month => { setLunarMonth(month); setLunarDay(Math.min(safeDay, Number(LunarMonth.fromYm(liunianYear, month)?.getDayCount() ?? 30))); setTimeView('liuyue'); }}
        onDayChange={day => { setLunarDay(day); setTimeView('liuri'); }}
        onHourChange={value => { setHour(value); setTimeView('liushi'); }}
      />

      {/* 命盘标题 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3"
      >
        <div className="text-[10px] tracking-[0.5em] uppercase mb-1" style={{ color: 'var(--t-faint)' }}>
          Zi Wei Dou Shu
        </div>
        <h2 className="text-sm tracking-[0.25em] font-medium" style={{ color: 'var(--t-gold)' }}>
          {chart.birthInfo.name ? `${chart.birthInfo.name} · ` : ''}紫微斗数命盘
        </h2>
      </motion.div>

      <div className="relative sm:mx-12 sm:my-5 min-w-0">
        {ANIMATION_ORDER.map(branch => {
          const [row, col] = BRANCH_GRID_POS[branch];
          const horizontal = row === 1 || row === 4;
          const style = horizontal
            ? { left: `${(col - 0.5) * 25}%`, [row === 1 ? 'bottom' : 'top']: '100%', transform: 'translateX(-50%)' }
            : { top: `${(row - 0.5) * 25}%`, [col === 1 ? 'right' : 'left']: '100%', transform: 'translateY(-50%)' };
          return <span key={branch} className="hidden sm:block absolute whitespace-nowrap text-[10px] px-1" style={{ ...style, color: 'var(--t-faint)' }}>{DIRECTIONS[branch]}</span>;
        })}
      {/* 4x4 命盘网格（含 SVG 叠加层） */}
      <div
        className="grid rounded-xl overflow-hidden relative"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, auto)',
          gap: '1px',
          background: 'var(--t-border)',
          border: '1px solid var(--t-border)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
        }}
      >
        {ANIMATION_ORDER.map((branch, i) => {
          const [row, col] = BRANCH_GRID_POS[branch];
          const palace = palaceMap[branch];
          if (!palace) return null;
          return (
            <div key={branch} style={{ gridRow: row, gridColumn: col, background: 'var(--t-bg)' }}>
              <PalaceCell
                palace={palace}
                onClick={() => handlePalaceClick(branch)}
                onStarClick={(star) => onStarSelect?.(star, palace)}
                isSelected={selectedBranch === branch}
                isSanFang={!!(sanFangSet?.has(branch) && selectedBranch !== branch)}
                delay={i * 0.04}
                overlayStarSiHua={Object.keys(overlayData).length > 0 ? overlayData : undefined}
                overlayLabel={overlayLabel}
                layerPalaceName={layer ? `${overlayLabel}${layer.palaceNames[branch].slice(0, 1)}` : undefined}
                onSiHuaClick={(starName, siHua) => onSiHuaClick?.(starName, siHua, timeView)}
              />
            </div>
          );
        })}

        {/* 中央信息区 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center justify-center p-4 gap-3"
          style={{ gridRow: '2 / 4', gridColumn: '2 / 4', background: 'var(--t-bg)' }}
        >
          <div className="text-5xl select-none leading-none" style={{ color: 'var(--t-gold)', opacity: 0.12, filter: 'drop-shadow(0 0 12px rgba(180,120,30,0.15))' }}>
            ☯
          </div>

          <div className="text-center space-y-1">
            <div className="text-[9px] tracking-[0.3em] font-medium" style={{ color: 'var(--t-gold)' }}>紫微斗数</div>
            <div className="text-[10px] space-y-0.5" style={{ color: 'var(--t-faint)' }}>
              <div>命宫 <span style={{ color: 'var(--t-gold)', opacity: 0.7 }}>{BRANCHES[chart.mingGongBranch]}</span></div>
              <div>身宫 <span className="text-sky-500/70">{BRANCHES[chart.shenGongBranch]}</span></div>
              <div className="text-[9px]" style={{ color: 'var(--t-gold)', opacity: 0.75 }}>{chart.wuxingJuName}</div>
            </div>
          </div>

          {chart.currentDaXianIndex >= 0 && (() => {
            const dx = chart.daXians[chart.currentDaXianIndex];
            return (
              <div className="border border-purple-500/30 rounded-lg px-3 py-1.5 text-center"
                style={{ background: 'rgba(147,51,234,0.06)' }}>
                <div className="text-[8px] text-purple-500/80 mb-0.5 tracking-wider">当前大限</div>
                <div className="text-[12px] text-purple-400 font-medium tabular-nums">{dx.startAge}–{dx.endAge}岁</div>
                <div className="text-[9px] text-purple-500/60">{dx.palaceName}</div>
              </div>
            );
          })()}

          <div className="text-[8px] text-center leading-relaxed font-mono" style={{ color: 'var(--t-faint)', opacity: 0.75 }}>
            {chart.lunarInfo.lunarYear}·{chart.lunarInfo.isLeapMonth ? '闰' : ''}
            {chart.lunarInfo.lunarMonth}·{chart.lunarInfo.lunarDay}
          </div>
        </motion.div>

        {/* ── 三方四正 SVG 连线（绝对定位在 grid 内部，受 overflow:hidden 裁切） ── */}
        <AnimatePresence>
          {sanFangBranches !== null && (
            <motion.div
              key={`sf-${selectedBranch}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
              }}
            >
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
              >
                {(() => {
                  // 三角形（三方）+ 一条直线（对宫）
                  const p0 = BRANCH_SVG_POS[sanFangBranches[0]]; // 本宫
                  const p1 = BRANCH_SVG_POS[sanFangBranches[1]]; // 对宫
                  const p2 = BRANCH_SVG_POS[sanFangBranches[2]]; // 三合1
                  const p3 = BRANCH_SVG_POS[sanFangBranches[3]]; // 三合2
                  const dash = "6,5";
                  const stroke = "rgba(37,99,235,0.55)";
                  const sw = "1.5";
                  return (
                    <>
                      {/* 对宫直线：本宫 ↔ 对宫（穿过中心） */}
                      <line
                        x1={`${p0[0]}%`} y1={`${p0[1]}%`}
                        x2={`${p1[0]}%`} y2={`${p1[1]}%`}
                        stroke={stroke} strokeWidth={sw}
                        strokeDasharray={dash} strokeLinecap="round"
                      />
                      {/* 三合三角形：本宫 → 三合1 → 三合2 → 本宫 */}
                      <line
                        x1={`${p0[0]}%`} y1={`${p0[1]}%`}
                        x2={`${p2[0]}%`} y2={`${p2[1]}%`}
                        stroke={stroke} strokeWidth={sw}
                        strokeDasharray={dash} strokeLinecap="round"
                      />
                      <line
                        x1={`${p2[0]}%`} y1={`${p2[1]}%`}
                        x2={`${p3[0]}%`} y2={`${p3[1]}%`}
                        stroke={stroke} strokeWidth={sw}
                        strokeDasharray={dash} strokeLinecap="round"
                      />
                      <line
                        x1={`${p3[0]}%`} y1={`${p3[1]}%`}
                        x2={`${p0[0]}%`} y2={`${p0[1]}%`}
                        stroke={stroke} strokeWidth={sw}
                        strokeDasharray={dash} strokeLinecap="round"
                      />
                      {/* 四个宫位中心标记点 */}
                      {[p0, p1, p2, p3].map((p, i) => (
                        <circle
                          key={i}
                          cx={`${p[0]}%`} cy={`${p[1]}%`}
                          r="3"
                          fill={i === 0 ? 'rgba(37,99,235,0.8)' : 'rgba(37,99,235,0.45)'}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </div>

      {/* 图例 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-3 flex items-center justify-center gap-2 text-[9px] flex-wrap"
      >
        {[
          { h: '化禄', c: 'text-emerald-500 border-emerald-500/30' },
          { h: '化权', c: 'text-blue-500 border-blue-500/30' },
          { h: '化科', c: 'text-yellow-500 border-yellow-500/30' },
          { h: '化忌', c: 'text-red-500 border-red-500/30' },
        ].map(({ h, c }) => (
          <span key={h} className={`border px-1.5 py-0.5 rounded-full font-medium ${c}`}>{h}</span>
        ))}
        <span style={{ color: 'var(--t-faint)' }}>↻禄 / 权 / 科 / 忌：宫干自化</span>
        <span className="px-1.5 py-0.5 rounded-full" style={{ color: 'var(--t-faint)', border: '1px solid var(--t-border)' }}>
          点击宫位看三方四正
        </span>
      </motion.div>
    </div>
  );
}
