'use client';
import { useState } from 'react';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import RecentCharts from '@/components/RecentCharts';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import ReadingsPanel from '@/components/ReadingsPanel';
import SiteHeader from '@/components/SiteHeader';
import PageIntro from '@/components/PageIntro';
import { BRANCHES, SHICHEN } from '@/lib/ziwei/constants';
import { saveToHistory } from '@/lib/ziwei/history';
import { loadEngine, usePrefetchEngine } from '@/lib/ziwei/load-engine';
import { formToBirthInfo } from '@/lib/ziwei/share';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/**
 * 命盘页：未起盘时是出生信息表单；起盘后是「命盘 + AI 解读」工作台，下方接 13 个主题的本命盘解读。
 * 排盘内核（安星、四化、格局、古籍库）全部在 lib/ziwei/*，可自由二次开发自己的界面。
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [engineLoading, setEngineLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** 最近一次提交的表单：「重新起盘」回到表单时原样回填，改一个时辰不用全部重填。 */
  const [lastForm, setLastForm] = useState<BirthFormState | null>(null);
  /** 从历史重排时换 key，让表单按新的 initialData 重新挂载。 */
  const [formKey, setFormKey] = useState(0);

  usePrefetchEngine();

  const cast = async (info: BirthInfo, form: BirthFormState) => {
    setEngineLoading(true);
    setSubmitError(null);
    setLastForm(form);
    let engine: Awaited<ReturnType<typeof loadEngine>>;
    try {
      engine = await loadEngine();
    } catch (e) {
      console.error(e);
      setSubmitError('排盘程序没能下载完成，请检查网络后再点一次「立即起盘」。');
      setEngineLoading(false);
      return;
    }
    try {
      setChart(engine.generateChart(info));
      saveToHistory(form);
      window.scrollTo({ top: 0 });
    } catch (e) {
      console.error(e);
      setSubmitError(e instanceof RangeError
        ? '这组出生信息排不了盘，请核对日期是否真实存在（例如 2 月 30 日）。'
        : '排盘时出了点问题，请稍后再试。');
    } finally {
      setEngineLoading(false);
    }
  };

  if (!chart) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-[640px] px-4 pb-24 pt-12 sm:pt-16">
          <PageIntro eyebrow="紫微斗数 · 排盘" title="输入生辰，排出你的命盘" className="mb-10">
            填写公历出生日期与时间，即时排出十二宫、主辅星曜与四化。填了出生地，时辰会按真太阳时校正。
          </PageIntro>
          <RecentCharts disabled={engineLoading} onPick={form => { setFormKey(k => k + 1); cast(formToBirthInfo(form), form); }} />
          <BirthForm
            key={formKey}
            loading={engineLoading}
            initialData={lastForm ?? undefined}
            onSubmit={cast}
          />
          {submitError && (
            <p role="alert" className="mt-4 rounded-xl px-4 py-3 text-[14px] leading-relaxed" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--tx-0)' }}>
              {submitError}
            </p>
          )}
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
      <main id="main" className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 pb-24 pt-8">
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
