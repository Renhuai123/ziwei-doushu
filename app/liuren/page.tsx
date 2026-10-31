'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { calculateLiuren, LIUREN_HOURS, LIUREN_PALACES } from '@/lib/liuren';

type Reading = ReturnType<typeof calculateLiuren>;
const STORAGE_KEY = 'liuren-daily-readings';
const monthNames = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const dayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** 本地存储不可用时允许继续起课。 */
function recordReading(date: Date): boolean {
  try {
    const key = localDateKey(date);
    const raw = localStorage.getItem(STORAGE_KEY);
    let stored: { date?: unknown; count?: unknown } = {};
    if (raw) {
      try { stored = JSON.parse(raw) ?? {}; } catch { /* 损坏记录视作新的一天 */ }
    }
    const count = stored.date === key && Number.isInteger(stored.count) && Number(stored.count) >= 0 ? Number(stored.count) : 0;
    if (count >= 3) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: key, count: count + 1 }));
    return true;
  } catch {
    return true;
  }
}

function formatLunar(reading: Reading): string {
  return `农历${reading.isLeapMonth ? '闰' : ''}${monthNames[reading.lunarMonth - 1]}月${dayNames[reading.lunarDay - 1]} · ${LIUREN_HOURS[reading.hourBranch]}时`;
}

export default function LiurenPage() {
  const [now, setNow] = useState<Date | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [stage, setStage] = useState(0);
  const [notice, setNotice] = useState('');
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!reading || stage >= 3) return;
    const timer = window.setTimeout(() => setStage(value => value + 1), reducedMotion ? 0 : 450);
    return () => window.clearTimeout(timer);
  }, [reading, stage, reducedMotion]);

  const startReading = () => {
    const moment = new Date();
    setNow(moment);
    if (!recordReading(moment)) {
      setNotice('今天已起三课，请明天再来。');
      return;
    }
    setNotice('');
    setStage(0);
    setReading(calculateLiuren(moment));
  };

  const steps = reading ? [
    { label: '月宫', detail: `${reading.isLeapMonth ? '闰' : ''}${monthNames[reading.lunarMonth - 1]}月`, index: reading.monthPalace },
    { label: '日宫', detail: dayNames[reading.lunarDay - 1], index: reading.dayPalace },
    { label: '时宫', detail: `${LIUREN_HOURS[reading.hourBranch]}时`, index: reading.hourPalace },
  ] : [];

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-0)', color: 'var(--tx-1)' }}>
      <header className="border-b px-5 sm:px-8" style={{ borderColor: 'var(--bdr)' }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between">
          <Link href="/" className="text-sm" style={{ color: 'var(--tx-2)' }}>‹ 返回首页</Link>
          <span className="text-sm font-medium" style={{ color: 'var(--ac-dim)' }}>小六壬</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-8 sm:pt-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm" style={{ color: 'var(--tx-2)' }}>心中想一件事，按此刻起课。</p>
          <h1 className="text-4xl font-semibold tracking-[0.16em] sm:text-5xl" style={{ color: 'var(--tx-0)' }}>小六壬</h1>
          <p className="mt-5 text-sm" style={{ color: 'var(--tx-2)' }} suppressHydrationWarning>
            {now ? formatLunar(calculateLiuren(now)) : '正在读取此刻时间…'}
          </p>
          <button type="button" onClick={startReading} disabled={!!reading && stage < 3}
            className="mt-7 min-h-12 rounded-full px-10 text-sm font-semibold transition-opacity disabled:cursor-wait disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ background: 'var(--ac-dim)', color: 'var(--bg-0)', outlineColor: 'var(--ac)' }}>
            {reading ? '再起一课' : '起课'}
          </button>
          <p className="mt-3 min-h-6 text-sm" role="status" style={{ color: 'var(--tx-2)' }}>{notice || '一事一课，不诚不占'}</p>
        </section>

        {reading && <section className="mx-auto mt-8 max-w-3xl" aria-label="起课结果" aria-live="polite">
          <p className="mb-4 text-center text-xs" style={{ color: 'var(--tx-2)' }}>本课时间：{formatLunar(reading)}</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {steps.map((step, index) => {
              const visible = stage > index;
              return <motion.div key={`${step.label}-${reading.lunarDay}-${reading.hourBranch}`} initial={false}
                animate={{ opacity: visible ? 1 : 0.45, y: visible ? 0 : 4 }} transition={{ duration: reducedMotion ? 0 : 0.3 }}
                className="min-w-0 rounded-xl px-2 py-5 text-center sm:px-5" style={{ border: '1px solid var(--bdr-med)', background: 'var(--bg-card)' }}>
                <div className="text-xs" style={{ color: 'var(--tx-2)' }}>{step.label} · {step.detail}</div>
                <div className="mt-3 text-xl font-semibold sm:text-2xl" style={{ color: visible ? 'var(--ac-dim)' : 'var(--tx-3)' }}>{visible ? LIUREN_PALACES[step.index].name : '待揭晓'}</div>
              </motion.div>;
            })}
          </div>
          {stage >= 3 && <div className="mt-4 rounded-xl px-6 py-7 text-center" style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-bdr)' }}>
            <p className="text-sm" style={{ color: 'var(--tx-2)' }}>时宫所止 · 本课结果</p>
            <h2 className="mt-2 text-3xl font-semibold" style={{ color: 'var(--ac-dim)' }}>{reading.result.name} <span className="text-base">{reading.result.fortune}</span></h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--tx-2)' }}>{reading.result.meaning}</p>
          </div>}
        </section>}

        <section className="mt-16" aria-labelledby="palaces-heading">
          <h2 id="palaces-heading" className="text-xl font-semibold" style={{ color: 'var(--tx-0)' }}>六宫释义</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--tx-2)' }}>六宫依次循环，时宫所停之处即为本课结果。</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LIUREN_PALACES.map(palace => <article key={palace.name} className="rounded-xl px-5 py-5" style={{ border: '1px solid var(--bdr)', background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--tx-0)' }}>{palace.name}</h3>
                <span className="rounded-full px-3 py-1 text-xs" style={{ color: 'var(--ac-dim)', background: 'var(--ac-bg)' }}>{palace.fortune}</span>
              </div>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--tx-2)' }}>{palace.meaning}</p>
            </article>)}
          </div>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="method-heading">
          <h2 id="method-heading" className="text-xl font-semibold" style={{ color: 'var(--tx-0)' }}>怎么数</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7" style={{ color: 'var(--tx-2)' }}>
            <li>从大安开始，按农历月份顺数，起点算第一位，停下的就是月宫；闰月按本月算。</li>
            <li>从月宫开始，按农历日期顺数，月宫算第一位，停下的就是日宫。</li>
            <li>从日宫开始，子时数一、丑时数二，依次顺数到当前时辰，停下的就是结果。</li>
          </ol>
          <p className="mt-4 text-sm leading-7" style={{ color: 'var(--tx-2)' }}>子时从 23:00 开始，23 点以后仍用当天的农历日期。结果仅供传统文化学习参考。</p>
        </section>
      </div>
    </main>
  );
}
