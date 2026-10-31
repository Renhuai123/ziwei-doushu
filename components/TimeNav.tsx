'use client';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { CHILDHOOD_DAXIAN_INDEX, getChildhoodYears, getDaXianYears, type YunxianView } from '@/lib/ziwei/yunxian-context';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { HoroscopeLayer } from '@/lib/ziwei/horoscope';

export type TimeView = YunxianView;
export const VIEW_LABELS: Record<TimeView, string> = {
  mingpan: '本命', daxian: '大限', xiaoxian: '小限', liunian: '流年', liuyue: '流月', liuri: '流日', liushi: '流时',
};

interface TimeNavProps {
  chart: ZiweiChart;
  view: TimeView;
  selectedDaXian: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  dayCount: number;
  layer?: HoroscopeLayer;
  onViewChange: (view: TimeView) => void;
  onDaXianChange: (index: number) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onDayChange: (day: number) => void;
  onHourChange: (hour: number) => void;
}

const views: TimeView[] = ['mingpan', 'daxian', 'xiaoxian', 'liunian', 'liuyue', 'liuri', 'liushi'];
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

export default function TimeNav({ chart, view, selectedDaXian, year, month, day, hour, dayCount, layer, onViewChange, onDaXianChange, onYearChange, onMonthChange, onDayChange, onHourChange }: TimeNavProps) {
  const years = selectedDaXian === CHILDHOOD_DAXIAN_INDEX ? getChildhoodYears(chart) : getDaXianYears(chart, selectedDaXian);
  const childhoodYears = getChildhoodYears(chart);
  const level = views.indexOf(view);
  const button = (label: string, active: boolean, click: () => void, key: string | number = label) => (
    <button key={key} type="button" onClick={click} aria-pressed={active}
      className="shrink-0 rounded-md px-2 py-1 text-[11px] whitespace-nowrap"
      style={{ color: active ? 'var(--t-gold)' : 'var(--t-faint)', background: active ? 'rgba(212,168,67,0.14)' : 'transparent', border: active ? '1px solid rgba(212,168,67,0.35)' : '1px solid transparent' }}>
      {label}
    </button>
  );
  const row = (label: string, children: React.ReactNode) => (
    <div className="flex min-w-0 items-center gap-1 mt-1">
      <span className="shrink-0 text-[10px]" style={{ color: 'var(--t-faint)' }}>{label}</span>
      <div className="flex min-w-0 overflow-x-auto gap-1">{children}</div>
    </div>
  );
  return (
    <div className="mb-3 min-w-0">
      <div className="flex min-w-0 overflow-x-auto rounded-xl p-1 gap-1" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
        {views.map(v => button(VIEW_LABELS[v], v === view, () => onViewChange(v), v))}
      </div>
      {level >= 1 && row('大限', <>
        {childhoodYears.length > 0 && button(`1–${childhoodYears.length}岁`, selectedDaXian === CHILDHOOD_DAXIAN_INDEX, () => onDaXianChange(CHILDHOOD_DAXIAN_INDEX))}
        {chart.daXians.map((dx, i) => button(`${dx.startAge}–${dx.endAge}岁`, selectedDaXian === i, () => onDaXianChange(i), i))}
      </>)}
      {level >= 1 && row('流年', years.map(y => button(`${y} ${y - chart.lunarInfo.lunarYear + 1}岁 ${STEMS[((y - 4) % 10 + 10) % 10]}${BRANCHES[((y - 4) % 12 + 12) % 12]}`, year === y, () => onYearChange(y), y)))}
      {level >= 4 && row('农历月', Array.from({ length: 12 }, (_, i) => button(`${i + 1}月`, month === i + 1, () => onMonthChange(i + 1), i)))}
      {level >= 5 && row('农历日', Array.from({ length: dayCount }, (_, i) => button(lunarDays[i], day === i + 1, () => onDayChange(i + 1), i)))}
      {level >= 6 && row('时辰', BRANCHES.map((b, i) => button(`${b}时`, hour === i, () => onHourChange(i), i)))}
      {layer && <div className="mt-1 px-1 text-[10px]" style={{ color: 'var(--t-faint)' }}>
        {VIEW_LABELS[view]}·{STEMS[layer.stem]}{BRANCHES[layer.ganzhiBranch]}四化：{(['禄', '权', '科', '忌'] as const).map(sh => `${layer.siHua[sh]}化${sh}`).join('　')}
      </div>}
    </div>
  );
}
