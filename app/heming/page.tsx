'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import type { HemingRelation } from '@/lib/ai/prompts';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { generateChart as buildChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';
import { useTheme } from '@/components/ThemeProvider';

type Message = { role: 'user' | 'assistant'; content: string };
const RELATIONS: { value: HemingRelation; label: string; palaces: string }[] = [
  { value: 'love', label: '感情', palaces: '夫妻宫、福德宫' },
  { value: 'partner', label: '合伙', palaces: '兄弟宫、仆役宫' },
  { value: 'work', label: '上下级', palaces: '官禄宫、仆役宫' },
  { value: 'friend', label: '朋友', palaces: '仆役宫' },
];

// ─── AiContent 渲染器（与 InsightPanel 一致）────────────────
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} style={{ paddingTop: i === 0 ? 0 : '14px', paddingBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ac)', letterSpacing: '0.04em' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} style={{ height: '4px' }} />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} style={{ fontSize: '13px', lineHeight: 1.75, color: 'var(--tx-2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} style={{ fontWeight: 500, color: 'var(--tx-0)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span style={{
          display: 'inline-block', width: '7px', height: '13px',
          background: 'var(--ac)', opacity: 0.5, borderRadius: '2px',
          animation: 'pulse 1s ease-in-out infinite',
          verticalAlign: 'middle', marginLeft: '2px',
        }} />
      )}
    </div>
  );
}

export default function HemingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ─── 双方命盘状态 ─────────────────────────────────────────
  const [chartA, setChartA] = useState<ZiweiChart | null>(null);
  const [chartB, setChartB] = useState<ZiweiChart | null>(null);
  // 双方表单状态由 BirthForm onFormSave 同步到此处，统一按钮触发起盘
  const [formA, setFormA] = useState<BirthFormState | null>(null);
  const [formB, setFormB] = useState<BirthFormState | null>(null);

  // ─── AI 合盘分析状态 ─────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [relation, setRelation] = useState<HemingRelation>('love');
  const [showCharts, setShowCharts] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  const [analysisError, setAnalysisError] = useState(false);
  // 开源版不含 /api/heming：接口 404 时单独说明，而不是让用户反复重试
  const [apiMissing, setApiMissing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const formARef = useRef<BirthFormState | null>(null);
  const formBRef = useRef<BirthFormState | null>(null);

  const resetConversation = useCallback(() => {
    generationRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setMessages([]);
    setStreamingText('');
    setPendingQuestion('');
    setQuestion('');
    setAnalyzing(false);
    setAnalysisError(false);
    setApiMissing(false);
  }, []);

  const saveForm = useCallback((side: 'A' | 'B', form: BirthFormState) => {
    const previous = side === 'A' ? formARef : formBRef;
    if (previous.current && JSON.stringify(previous.current) !== JSON.stringify(form)) {
      resetConversation();
      if (side === 'A') setChartA(null); else setChartB(null);
      setShowCharts(false);
    }
    previous.current = form;
    if (side === 'A') setFormA(form); else setFormB(form);
  }, [resetConversation]);

  // ─── 起盘（单次调用，返回 chart 给统一流程使用）──────────
  // 开源版不含后端 /api/generate：直接用本仓库的排盘引擎在浏览器里起盘
  const generateChart = useCallback(async (info: BirthInfo): Promise<ZiweiChart | null> => {
    try {
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
    if (requestRef.current) return;
    setFormError(null);
    if (!isFormReady(formA) || !isFormReady(formB)) {
      setFormError('请先填写双方完整出生信息');
      return;
    }
    const userQuestion = q?.trim() || (messages.length === 0 ? '请按本次关系类型的默认结构为我们做一次完整的合盘分析。' : '');
    if (!userQuestion) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const generation = generationRef.current;
    const currentMessages: Message[] = [...messages, { role: 'user', content: userQuestion }];
    setAnalyzing(true);
    setPendingQuestion(messages.length ? userQuestion : '');
    setStreamingText('');
    setAnalysisError(false);
    setQuestion('');

    try {
      // 并行起两张盘（如果还没起）
      let cA = chartA;
      let cB = chartB;
      const [newA, newB] = await Promise.all([
        cA ? Promise.resolve(cA) : generateChart(formToBirthInfo(formA!)),
        cB ? Promise.resolve(cB) : generateChart(formToBirthInfo(formB!)),
      ]);
      cA = newA;
      cB = newB;
      if (generation !== generationRef.current) return;
      if (!cA || !cB) {
        setAnalysisError(true);
        setAnalyzing(false);
        return;
      }
      if (!chartA) setChartA(cA);
      if (!chartB) setChartB(cB);

      const res = await fetch('/api/heming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartA: cA, chartB: cB, relation, messages: currentMessages }),
        signal: controller.signal,
      });
      if (res.status === 404) { setApiMissing(true); throw new Error('api-missing'); }
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            text += delta;
            if (generation === generationRef.current) setStreamingText(text);
          } catch { /* skip */ }
        }
      }
      if (generation !== generationRef.current) return;
      if (!text.trim()) throw new Error('empty response');
      setMessages([...currentMessages, { role: 'assistant', content: text }]);
      setStreamingText('');
      setPendingQuestion('');
      // scroll to analysis
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      if (generation === generationRef.current && !controller.signal.aborted) {
        setAnalysisError(true);
        if (messages.length) setQuestion(userQuestion);
      }
    } finally {
      if (generation === generationRef.current) {
        requestRef.current = null;
        setAnalyzing(false);
        setPendingQuestion('');
        setStreamingText('');
      }
    }
  }, [chartA, chartB, formA, formB, generateChart, messages, relation]);

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(200,160,60,0.2)'}`,
    borderRadius: '16px',
    padding: '24px',
  };

  const labelStyle = {
    fontSize: '10px', letterSpacing: '0.4em', color: 'var(--ac)', opacity: 0.7,
    marginBottom: '16px', display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      {/* 顶栏 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isDark ? 'rgba(2,8,16,0.88)' : 'rgba(250,245,235,0.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--bdr)',
        display: 'flex', alignItems: 'center', padding: '0 24px', height: '52px', gap: '16px',
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px',
            color: 'var(--tx-3)', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>返回</span>
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>合盘分析</span>
        <div style={{ flex: 1 }} />
        <span className="hidden sm:inline" style={{ fontSize: '11px', color: 'var(--tx-3)' }}>感情 · 合伙 · 上下级 · 朋友</span>
      </header>

      {/* 主体 */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '28px', color: 'var(--ac)', opacity: 0.15, marginBottom: '12px' }}>☯</div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '0.15em', color: 'var(--tx-0)', marginBottom: '8px' }}>
            紫微合盘
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--tx-3)', lineHeight: 1.6 }}>
            输入两个人的出生信息，选择关系类型，分析双方命盘与相处方式
          </p>
        </div>

        {/* 双栏表单 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}
          className="heming-grid">
          {/* 甲方 */}
          <div style={cardStyle}>
            <span style={labelStyle}>甲方 — A</span>
            <BirthForm
              hideSubmit
              onSubmit={() => {}}
              onFormSave={form => saveForm('A', form)}
            />
          </div>

          {/* 乙方 */}
          <div style={cardStyle}>
            <span style={labelStyle}>乙方 — B</span>
            <BirthForm
              hideSubmit
              onSubmit={() => {}}
              onFormSave={form => saveForm('B', form)}
            />
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <span style={labelStyle}>关系类型</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {RELATIONS.map(option => <button key={option.value} type="button" aria-pressed={relation === option.value}
              onClick={() => { if (relation !== option.value) { resetConversation(); setRelation(option.value); } }}
              style={{ textAlign: 'left', border: `1px solid ${relation === option.value ? 'var(--ac)' : 'var(--bdr)'}`, borderRadius: 10, padding: '10px', background: 'transparent', color: 'var(--tx-0)', cursor: 'pointer', minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13 }}>{option.label}</span>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--tx-3)', marginTop: 4 }}>看：{option.palaces}</span>
            </button>)}
          </div>
        </div>

        {chartA && chartB && <div style={{ ...cardStyle, marginBottom: 24 }}>
          <button type="button" aria-expanded={showCharts} onClick={() => setShowCharts(value => !value)}
            style={{ background: 'transparent', border: 0, color: 'var(--ac)', cursor: 'pointer', fontSize: 14 }}>
            {showCharts ? '收起两盘对照' : '展开两盘对照'}
          </button>
          {showCharts && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4 min-w-0">
            <div className="min-w-0"><div style={labelStyle}>甲方命盘</div><ChartBoard chart={chartA} /></div>
            <div className="min-w-0"><div style={labelStyle}>乙方命盘</div><ChartBoard chart={chartB} /></div>
          </div>}
        </div>}

        {/* ═══ 大合盘分析框（视觉中心，始终显示）════════════════ */}
        <div ref={analysisRef} style={{
          ...cardStyle,
          minHeight: '320px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: (!messages.length && !analyzing) ? 'center' : 'flex-start',
        }}>
          {/* 区块标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: (messages.length || analyzing) ? '20px' : '24px' }}>
            <span style={{ color: 'var(--ac)', opacity: 0.6 }}>◉</span>
            <span style={{ fontSize: '11px', letterSpacing: '0.3em', color: 'var(--tx-3)' }}>合盘分析 · HEMING</span>
          </div>

          {/* 状态分支 */}
          {!messages.length && !analyzing && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '13px', color: 'var(--tx-3)', marginBottom: '24px', lineHeight: 1.7 }}>
                填好双方出生信息后，点击下方按钮<br />
                AI 将按所选关系分析两人命盘和相处方式
              </div>
              <button
                onClick={() => runAnalysis()}
                style={{
                  padding: '14px 40px', borderRadius: 'var(--r-pill)', border: 'none',
                  background: 'linear-gradient(135deg, #9a6210, #c88020)',
                  color: '#fff8e8', fontSize: '14px', fontWeight: 600,
                  letterSpacing: '0.15em', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(140,100,20,0.25)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                开始合盘分析
              </button>
              {formError && (
                <div style={{ marginTop: '20px', fontSize: '13px', color: '#dc2626' }}>
                  {formError}
                </div>
              )}
            </div>
          )}

          {analyzing && !streamingText && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0', color: 'var(--tx-3)', fontSize: '13px' }}>
              <div style={{
                width: '14px', height: '14px',
                border: '2px solid var(--bdr-med)', borderTopColor: 'var(--ac)',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              正在对比双方命盘…
            </div>
          )}

          {messages.map((message, i) => message.role === 'user'
            ? (i === 0 ? null : <div key={i} style={{ color: 'var(--ac)', margin: '18px 0 8px', overflowWrap: 'anywhere' }}>你：{message.content}</div>)
            : <div key={i} style={{ marginBottom: 16, overflowWrap: 'anywhere' }}><AiContent text={message.content} /></div>)}
          {pendingQuestion && <div style={{ color: 'var(--ac)', margin: '18px 0 8px', overflowWrap: 'anywhere' }}>你：{pendingQuestion}</div>}
          {streamingText && <AiContent text={streamingText} streaming={analyzing} />}

          {analysisError && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--bdr)', background: 'var(--bg-card)', fontSize: '13px', color: 'var(--tx-2)', marginTop: '12px' }}>
              {apiMissing
                ? '开源版不含合盘 AI 分析接口（/api/heming），需要你自己实现后才能用。两人的命盘可以分别到「排盘」页（/chart）查看。'
                : '分析暂时不可用，请重试。'}
            </div>
          )}
        </div>

        {/* ═══ 针对合盘的追问聊天框（仅分析完成后显示）═══════════ */}
        {messages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--tx-3)', marginBottom: '4px' }}>
              针对此次合盘继续追问
            </div>

            {/* 快捷问题 */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['双方相处的优势是什么？', '哪方面最容易产生矛盾？', '如何改善沟通与合作？'].map(q => (
                <button
                  key={q}
                  onClick={() => runAnalysis(q)}
                  disabled={analyzing}
                  style={{
                    fontSize: '12px', padding: '6px 14px',
                    borderRadius: 'var(--r-pill)',
                    border: '1px solid var(--bdr-med)',
                    background: 'transparent', color: 'var(--tx-2)',
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                    opacity: analyzing ? 0.5 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!analyzing) (e.currentTarget as HTMLElement).style.borderColor = 'var(--ac-bdr)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bdr-med)'; }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 输入框 + 追问按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !analyzing) runAnalysis(question || undefined); }}
                placeholder="继续追问，如：如何改善相处？"
                disabled={analyzing}
                className="input-base"
                style={{ fontSize: '13px', flex: 1, minWidth: 0 }}
              />
              <button
                onClick={() => runAnalysis(question || undefined)}
                disabled={analyzing}
                style={{
                  padding: '10px 20px', borderRadius: 'var(--r-sm)', border: 'none',
                  background: analyzing ? 'var(--bg-2)' : 'var(--tx-0)',
                  color: analyzing ? 'var(--tx-3)' : 'white',
                  fontSize: '13px', fontWeight: 500,
                  cursor: analyzing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {analyzing ? '分析中…' : '继续追问'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 680px) {
          .heming-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
