'use client';

import { useEffect, useRef, useState } from 'react';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import ChartSummary from '@/components/ChartSummary';
import InsightPanel from '@/components/InsightPanel';
import ShareModal from '@/components/ShareModal';
import StarDetailPanel from '@/components/StarDetailPanel';
import type { TimeView } from '@/components/TimeNav';
import { generateChart } from '@/lib/ziwei/algorithm';
import { useHistory } from '@/lib/ziwei/history';
import { birthDateChangeNotice, formToBirthInfo, formToSearchParams, resolveBirthTime } from '@/lib/ziwei/share';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { parseChartForm } from './chart-form';
import { getChartAnalysis } from './actions';

export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [form, setForm] = useState<BirthFormState | null>(null);
  const formRef = useRef<BirthFormState | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedStar, setSelectedStar] = useState<{ star: Star; palaceName: string } | null>(null);
  const [selectedSiHua, setSelectedSiHua] = useState<{ starName: string; siHua: string; view: TimeView } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof getChartAnalysis>> | null>(null);
  const [analysisError, setAnalysisError] = useState(false);
  const { history, save, remove } = useHistory();

  const openChart = (birthForm: BirthFormState, saveHistory = false) => {
    try {
      const result = generateChart(formToBirthInfo(birthForm));
      formRef.current = birthForm;
      setForm(birthForm);
      setSelectedPalace(null);
      setSelectedStar(null);
      setSelectedSiHua(null);
      setError('');
      setChart(result);
      if (saveHistory) save(birthForm);
    } catch {
      setError('出生信息无效，请检查日期和时间。');
    }
  };

  useEffect(() => {
    const parsed = parseChartForm(new URLSearchParams(window.location.search));
    if (parsed) openChart(parsed);
    // URL is read once on entry, not again when the form is reopened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chart) return;
    let active = true;
    setAnalysis(null);
    setAnalysisError(false);
    getChartAnalysis({ birthInfo: chart.birthInfo }).then(result => {
      if (active) setAnalysis(result);
    }).catch(() => {
      if (active) setAnalysisError(true);
    });
    return () => { active = false; };
  }, [chart]);

  if (!chart || !form) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>紫微斗数排盘</h1>
        <p style={{ color: '#888', marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>
          输入出生年月日时，开源排盘引擎即时生成命盘。<br />
          （本页为引擎 Demo，完整商业版界面不在开源范围；排盘内核完全开放。）
        </p>
        <BirthForm
          initialData={form ?? undefined}
          onFormSave={value => { formRef.current = value; }}
          onSubmit={() => { if (formRef.current) openChart(formRef.current, true); }}
        />
        {error && <p role="alert" style={{ color: 'var(--t-text2)' }}>{error}</p>}
        {history.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>最近起盘</h2>
            <ul style={{ display: 'grid', gap: 8 }}>
              {history.map(entry => (
                <li key={entry.id} style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => openChart(entry.form)} style={{ flex: 1, textAlign: 'left', padding: 10, border: '1px solid var(--t-border)', borderRadius: 8 }}>
                    {entry.label}
                  </button>
                  <button type="button" onClick={() => remove(entry.id)} aria-label={`删除 ${entry.label}`} style={{ padding: '6px 12px', border: '1px solid var(--t-border)', borderRadius: 8 }}>删除</button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    );
  }

  const shareUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/chart?${formToSearchParams(form)}`;
  const dateNotice = birthDateChangeNotice(resolveBirthTime(form));
  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button type="button" onClick={() => {
          setChart(null); setSelectedPalace(null); setSelectedStar(null); setSelectedSiHua(null); setSharing(false);
          window.history.replaceState(window.history.state, '', window.location.pathname);
        }} style={{ padding: '6px 14px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: 8, background: 'transparent' }}>← 重新起盘</button>
        <button type="button" onClick={() => setSharing(true)} style={{ padding: '6px 14px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: 8, background: 'transparent' }}>分享</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--t-text2)', marginBottom: 12, lineHeight: 1.6 }}>
        {form.unknownTime && <p>时辰不详，按子时起盘，命宫与时辰相关的星曜仅供参考。</p>}
        {!form.province && <p>未填出生地，按北京时间排盘，未做真太阳时校正。</p>}
        {dateNotice && <p>{dateNotice}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        <div>
          <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace}
            onStarSelect={(star, palace) => setSelectedStar({ star, palaceName: palace.name })}
            onSiHuaClick={(starName, siHua, view) => setSelectedSiHua({ starName, siHua, view })} />
          <div style={{ marginTop: 16 }}>
            {analysis && <ChartSummary chart={chart} patterns={analysis.patterns} summary={analysis.summary} />}
            {analysisError && <p role="alert">命盘摘要暂时无法加载，请稍后重试。</p>}
          </div>
        </div>
        <div>
          <StarDetailPanel star={selectedStar?.star ?? null} palaceName={selectedStar?.palaceName} onClose={() => setSelectedStar(null)} />
          <InsightPanel chart={chart} selectedPalace={selectedPalace} selectedSiHua={selectedSiHua} />
        </div>
      </div>
      <ShareModal open={sharing} onClose={() => setSharing(false)} shareUrl={shareUrl} chart={chart}
        birth={{ year: form.year, month: form.month, day: form.day, hour: form.clockHour, minute: form.clockMinute, gender: form.gender, city: form.city || undefined }} />
    </main>
  );
}
