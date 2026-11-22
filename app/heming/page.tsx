'use client';
import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import { formToBirthInfo } from '@/lib/ziwei/share';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';
import { readNotConfiguredNotice } from '@/lib/ai/not-configured';
import SiteHeader from '@/components/SiteHeader';
import PageIntro from '@/components/PageIntro';
import ReadingMarkdown from '@/components/ReadingMarkdown';
import SkeletonLines from '@/components/SkeletonLines';
import AiSetupNotice from '@/components/AiSetupNotice';
import { RecentPicker } from '@/components/RecentCharts';
import { saveToHistory } from '@/lib/ziwei/history';
import { formsFromHemingHash, hemingHash, replaceHash } from '@/lib/ziwei/chart-link';
import { CopyLinkButton, RestoreFromHash } from '@/components/ShareLink';
import { loadEngine, usePrefetchEngine } from '@/lib/ziwei/load-engine';
import { BRANCHES, SHICHEN } from '@/lib/ziwei/constants';

/** 一方命盘的要点：命宫主星、五行局、当前大限。 */
function chartFacts(chart: ZiweiChart) {
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const majors = ming?.stars.filter(s => s.type === 'major').map(s => s.name + (s.siHua ? `化${s.siHua}` : '')) ?? [];
  const dx = chart.currentDaXianIndex >= 0 ? chart.daXians[chart.currentDaXianIndex] : null;
  const { year, month, day, hour, gender } = chart.birthInfo;
  return [
    { label: '出生', value: `${year}.${month}.${day} ${SHICHEN[hour]?.name ?? ''} · ${gender === 'male' ? '男' : '女'}` },
    { label: '命宫', value: `${BRANCHES[chart.mingGongBranch]}宫 · ${majors.length ? majors.join(' ') : '空宫'}` },
    { label: '身宫', value: `${BRANCHES[chart.shenGongBranch]}宫` },
    { label: '五行局', value: chart.wuxingJuName },
    { label: '当前大限', value: dx ? `${dx.startAge}–${dx.endAge}岁 · ${dx.palaceName}` : '童限' },
  ];
}

const QUICK_QUESTIONS = [
  '感情匹配度如何？',
  '适合合伙创业吗？',
  '两人结婚是否合适？',
  '哪方面最容易产生矛盾？',
  '财运是否互补？',
];

function PartyLabel({ mark, title, children }: { mark: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className="grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold"
        style={{ border: '1px solid var(--ac-bdr)', background: 'var(--ac-bg)', color: 'var(--ac)' }}
      >
        {mark}
      </span>
      <h2 className="text-[14px] font-medium" style={{ color: 'var(--tx-0)' }}>{title}</h2>
      {children && <div className="ml-auto min-w-0">{children}</div>}
    </div>
  );
}

export default function HemingPage() {
  usePrefetchEngine();
  // ─── 双方命盘状态 ─────────────────────────────────────────
  const [chartA, setChartA] = useState<ZiweiChart | null>(null);
  const [chartB, setChartB] = useState<ZiweiChart | null>(null);
  // 双方表单状态由 BirthForm onFormSave 同步到此处，统一按钮触发起盘
  const [formA, setFormA] = useState<BirthFormState | null>(null);
  const [formB, setFormB] = useState<BirthFormState | null>(null);

  // ─── AI 合盘分析状态 ─────────────────────────────────────
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  const [analysisError, setAnalysisError] = useState(false);
  // /api/heming 返回 503（AI 未配置）时给出配置提示，而不是让用户反复重试
  const [notConfiguredNotice, setNotConfiguredNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // 从「最近排过」填入：换 key 让表单按 initialData 重新挂载，挂载后 onFormSave 会同步回 formA / formB
  const [initA, setInitA] = useState<BirthFormState | undefined>();
  const [initB, setInitB] = useState<BirthFormState | undefined>();
  const [keyA, setKeyA] = useState(0);
  const [keyB, setKeyB] = useState(0);

  // 合盘成功排出的两张盘也记进「最近排过」，排盘页和下次合盘都能直接选
  useEffect(() => { if (chartA && formA) saveToHistory(formA); }, [chartA]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (chartB && formB) saveToHistory(formB); }, [chartB]); // eslint-disable-line react-hooks/exhaustive-deps
  // 合盘成功后把双方出生信息写进地址的 #：刷新后回填，也可复制链接分享（打开链接不会自动调用 AI）
  useEffect(() => { if (chartA && chartB && formA && formB) replaceHash(hemingHash(formA, formB)); }, [chartA, chartB]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 起盘（单次调用，返回 chart 给统一流程使用）──────────
  // 开源版不含后端 /api/generate：直接用本仓库的排盘引擎在浏览器里起盘
  const generateChart = useCallback(async (info: BirthInfo): Promise<ZiweiChart | null> => {
    try {
      const { generateChart: buildChart } = await loadEngine();
      return buildChart(info);
    } catch {
      return null;
    }
  }, []);

  // 表单是否填齐
  const isFormReady = (f: BirthFormState | null): boolean =>
    !!(f && f.year && f.month && f.day && f.gender && (f.unknownTime || (f.clockHour !== '' && f.clockMinute !== '')));

  // ─── 统一入口：起盘 + 合盘分析 ─────────────────────────────
  const runAnalysis = useCallback(async (q?: string) => {
    setFormError(null);
    if (!isFormReady(formA) || !isFormReady(formB)) {
      setFormError('请先填写双方完整出生信息');
      return;
    }
    setAnalyzing(true);
    setAnalysis('');
    setAnalysisError(false);
    setNotConfiguredNotice(null);

    try {
      // 每次按当前表单起盘，避免编辑出生信息后复用旧盘。
      const [cA, cB] = await Promise.all([
        generateChart(formToBirthInfo(formA!)),
        generateChart(formToBirthInfo(formB!)),
      ]);
      if (!cA || !cB) {
        // 失败的是排盘（多半是引擎没下载完），不是 AI 分析，提示放在按钮下方
        setFormError('排盘没有成功：请检查网络后重试，或核对双方日期是否真实存在。');
        setAnalyzing(false);
        return;
      }
      setChartA(cA);
      setChartB(cB);

      const res = await fetch('/api/heming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartA: cA, chartB: cB, question: q ?? undefined }),
      });
      const notice = await readNotConfiguredNotice(res);
      if (notice) { setNotConfiguredNotice(notice); throw new Error(notice); }
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let pendingLine = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pendingLine += decoder.decode(value, { stream: true });
        const lines = pendingLine.split('\n');
        pendingLine = lines.pop() ?? '';
        for (const rawLine of lines) {
          const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            text += delta;
            setAnalysis(text);
          } catch { /* skip */ }
        }
      }
      // scroll to analysis
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setAnalysisError(true);
    } finally {
      setAnalyzing(false);
    }
  }, [formA, formB, generateChart]);

  const cardStyle = 'card-glass rounded-2xl';
  const showResult = analyzing || !!analysis || analysisError;

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 pb-24 pt-10 sm:pt-14">
        <PageIntro eyebrow="紫微斗数 · 合盘" title="两张命盘，看缘分与相处">
          分别填写两个人的出生信息，先并排对照双方命盘要点，再由 AI 按倪海厦体系分析匹配度、相处方式与关键年份。适用于感情、合伙、亲子与朋友。
        </PageIntro>

        <RestoreFromHash
          parse={formsFromHemingHash}
          onFound={({ a, b }) => { setInitA(a); setInitB(b); setKeyA(k => k + 1); setKeyB(k => k + 1); }}
          onInvalid={() => { replaceHash(''); setFormError('这个合盘链接不完整或有误，请重新填写双方出生信息。'); }}
        />
        {/* 双方表单：中间一枚「合」字印连接两侧 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
          <section aria-label="甲方出生信息" className="min-w-0">
            <PartyLabel mark="甲" title="甲方">
              <RecentPicker label="从最近排过填入甲方" onPick={f => { setInitA(f); setKeyA(k => k + 1); }} />
            </PartyLabel>
            <BirthForm key={keyA} initialData={initA} hideSubmit onSubmit={() => {}} onFormSave={setFormA} />
          </section>

          <div aria-hidden className="hidden md:flex flex-col items-center pt-10">
            <div className="w-px flex-1" style={{ background: 'linear-gradient(to bottom, transparent, var(--ac-bdr))' }} />
            <div
              className="my-3 grid h-12 w-12 place-items-center rounded-full text-[18px] font-semibold"
              style={{ border: '1px solid var(--ac-bdr)', background: 'var(--bg-0)', color: 'var(--ac)', boxShadow: '0 0 0 6px var(--ac-bg)' }}
            >
              合
            </div>
            <div className="w-px flex-1" style={{ background: 'linear-gradient(to top, transparent, var(--ac-bdr))' }} />
          </div>

          <section aria-label="乙方出生信息" className="min-w-0">
            <PartyLabel mark="乙" title="乙方">
              <RecentPicker label="从最近排过填入乙方" onPick={f => { setInitB(f); setKeyB(k => k + 1); }} />
            </PartyLabel>
            <BirthForm key={keyB} initialData={initB} hideSubmit onSubmit={() => {}} onFormSave={setFormB} />
          </section>
        </div>

        {/* 主操作 */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => runAnalysis()}
            disabled={analyzing}
            className="btn-cta h-12 px-10 text-[15px] tracking-[0.12em]"
          >
            {analyzing ? '分析中…' : chartA ? '重新合盘' : '开始合盘'}
          </button>
          <p role="status" className="text-[13px] min-h-[1.25rem]" style={{ color: formError ? '#dc2626' : 'var(--tx-3)' }}>
            {formError ?? (chartA ? '改了出生信息后点「重新合盘」即可更新' : '两方信息都填齐后即可开始')}
          </p>
          {chartA && chartB && <CopyLinkButton label="复制合盘链接" />}
        </div>

        {/* 双方命盘对照（起盘即显示，不依赖 AI） */}
        {chartA && chartB && (
          <section aria-label="双方命盘对照" className={`${cardStyle} mt-8 p-5 sm:p-6`}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-[16px] font-semibold" style={{ color: 'var(--tx-0)' }}>双方命盘对照</h2>
              <span className="text-[12px]" style={{ color: 'var(--tx-3)' }}>按当前填写的出生信息排盘</span>
            </div>
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[480px] text-[13px] border-collapse">
                <thead>
                  <tr>
                    <th className="w-24" />
                    {[chartA, chartB].map((c, i) => (
                      <th key={i} scope="col" className="text-left font-medium pb-3" style={{ color: 'var(--ac)' }}>
                        {i === 0 ? '甲方' : '乙方'}{c.birthInfo.name ? ` · ${c.birthInfo.name}` : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartFacts(chartA).map((row, r) => (
                    <tr key={row.label} style={{ borderTop: '1px solid var(--bdr)' }}>
                      <th scope="row" className="text-left font-normal py-2.5 pr-4 whitespace-nowrap" style={{ color: 'var(--tx-3)' }}>
                        {row.label}
                      </th>
                      <td className="py-2.5 pr-4 tabular-nums" style={{ color: 'var(--tx-1)' }}>{row.value}</td>
                      <td className="py-2.5 tabular-nums" style={{ color: 'var(--tx-1)' }}>{chartFacts(chartB)[r].value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* AI 合盘分析 */}
        {showResult && (
          <section ref={analysisRef} aria-label="合盘分析" aria-busy={analyzing} className={`${cardStyle} mt-6 p-5 sm:p-8 scroll-mt-20`}>
            <div className="flex items-center gap-2 mb-6">
              <span style={{ color: 'var(--ac)' }}>✦</span>
              <h2 className="text-[16px] font-semibold" style={{ color: 'var(--tx-0)' }}>AI 合盘分析</h2>
            </div>

            {analyzing && !analysis && (
              <div className="max-w-[68ch]"><SkeletonLines widths={[64, 100, 92, 100, 80, 48]} label="正在对比双方命盘" /></div>
            )}

            {analysis && <ReadingMarkdown text={analysis} streaming={analyzing} />}

            {analysisError && notConfiguredNotice && (
              <AiSetupNotice title="AI 合盘未启用" unaffected="上方的双方命盘对照不受影响。" hint={notConfiguredNotice} />
            )}

            {analysisError && !notConfiguredNotice && (
              <p className="text-[14px]" style={{ color: 'var(--tx-2)' }}>分析暂时不可用，请稍后重试。</p>
            )}

            {/* 追问（分析完成后） */}
            {analysis && (
              <div className="mt-10 pt-6" style={{ borderTop: '1px solid var(--bdr)' }}>
                <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--tx-0)' }}>针对这次合盘继续追问</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      type="button"
                      className="chip disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => { setQuestion(q); runAnalysis(q); }}
                      disabled={analyzing}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !analyzing) runAnalysis(question || undefined); }}
                    placeholder="如：哪几年是两人感情关键期？"
                    aria-label="追问内容"
                    disabled={analyzing}
                    className="flex-1 min-w-0 rounded-lg px-3 h-11 text-[14px] outline-none transition-colors focus:border-[var(--ac-bdr)]"
                    style={{ background: 'var(--bg-1)', border: '1px solid var(--bdr-med)', color: 'var(--tx-0)' }}
                  />
                  <button
                    type="button"
                    onClick={() => runAnalysis(question || undefined)}
                    disabled={analyzing}
                    className="px-5 h-11 rounded-lg text-[14px] font-medium whitespace-nowrap transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--ac)', color: 'var(--bg-0)' }}
                  >
                    {analyzing ? '分析中…' : '追问'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
