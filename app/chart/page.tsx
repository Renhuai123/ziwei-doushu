'use client';
import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import ReadingsPanel from '@/components/ReadingsPanel';
import SiteHeader from '@/components/SiteHeader';
import { BRANCHES, SHICHEN } from '@/lib/ziwei/constants';
import { loadEngine, usePrefetchEngine } from '@/lib/ziwei/load-engine';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/**
 * 命盘页：未起盘时是出生信息表单；起盘后是「命盘 + AI 解读」工作台，下方接 13 个主题的本命盘解读。
 * 排盘内核（安星、四化、格局、古籍库）全部在 lib/ziwei/*，可自由二次开发自己的界面。
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [engineLoading, setEngineLoading] = useState(false);

  usePrefetchEngine();

  if (!chart) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-[640px] px-4 pb-24 pt-12 sm:pt-16">
          <p className="eyebrow mb-4">紫微斗数 · 排盘</p>
          <h1
            className="text-[28px] sm:text-[34px] font-semibold leading-tight mb-3"
            style={{ color: 'var(--tx-0)', textWrap: 'balance' }}
          >
            输入生辰，排出你的命盘
          </h1>
          <p className="text-[15px] leading-relaxed mb-10" style={{ color: 'var(--tx-2)' }}>
            填写公历出生日期与时间，即时排出十二宫、主辅星曜与四化。填了出生地，时辰会按真太阳时校正。
          </p>
          <BirthForm
            loading={engineLoading}
            onSubmit={async (info: BirthInfo) => {
              setEngineLoading(true);
              try {
                const { generateChart } = await loadEngine();
                setChart(generateChart(info));
                window.scrollTo({ top: 0 });
              } finally {
                setEngineLoading(false);
              }
            }}
          />
        </main>
      </>
    );
  }

  const { birthInfo } = chart;
  const dx = chart.currentDaXianIndex >= 0 ? chart.daXians[chart.currentDaXianIndex] : null;
  const meta: { label: string; value: string }[] = [
    { label: '公历', value: `${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日` },
    { label: '时辰', value: SHICHEN[birthInfo.hour]?.name ?? '—' },
    { label: '性别', value: birthInfo.gender === 'male' ? '男' : '女' },
    { label: '命宫', value: BRANCHES[chart.mingGongBranch] },
    { label: '身宫', value: BRANCHES[chart.shenGongBranch] },
    { label: '五行局', value: chart.wuxingJuName },
    ...(dx ? [{ label: '当前大限', value: `${dx.startAge}–${dx.endAge}岁 · ${dx.palaceName}` }] : []),
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 pb-24 pt-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div className="min-w-0">
            <p className="eyebrow mb-2">本命盘</p>
            <h1 className="text-[24px] sm:text-[28px] font-semibold leading-tight" style={{ color: 'var(--tx-0)' }}>
              {birthInfo.name ? `${birthInfo.name}的命盘` : '你的命盘'}
            </h1>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
              {meta.map(m => (
                <div key={m.label} className="flex items-baseline gap-1.5">
                  <dt style={{ color: 'var(--tx-3)' }}>{m.label}</dt>
                  <dd className="tabular-nums" style={{ color: 'var(--tx-1)' }}>{m.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <button
            type="button"
            className="chip shrink-0 self-start sm:self-auto"
            onClick={() => { setChart(null); setSelectedPalace(null); }}
          >
            <span aria-hidden>↺</span> 重新起盘
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] items-start">
          <section aria-label="命盘" className="card-glass rounded-2xl p-3 sm:p-5 min-w-0">
            <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
          </section>
          <aside aria-label="AI 解读" className="lg:sticky lg:top-20 min-w-0">
            <InsightPanel chart={chart} selectedPalace={selectedPalace} />
          </aside>
        </div>

        <ReadingsPanel chart={chart} />
      </main>
    </>
  );
}
