import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { readNotConfiguredNotice, readRateLimitNotice } from '../../lib/ai/not-configured';
import { readSseText } from '../../lib/ai/read-sse';

// Feed real byte chunks through the page's original reader callback.
const source = readFileSync(new URL('../../app/heming/page.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  // 表单是否填齐');
const end = source.indexOf('  const cardStyle =', start);
assert.ok(start >= 0 && end > start);
const body = `export function makeRun(ctx) {
  const {chartA,chartB,formA,formB,generateChart,formToBirthInfo,setFormError,
    setAnalyzing,setAnalysis,setAnalysisError,setChartA,setChartB,fetch,
    setNotConfiguredNotice,readNotConfiguredNotice,setRateLimitNotice,readRateLimitNotice,readSseText,analysisRef,abortRef} = ctx;
  const useCallback = (fn) => fn;
  ${source.slice(start, end)}
  return runAnalysis;
}`;
const moduleExports: Record<string, (ctx: object) => () => Promise<void>> = {};
new Function('exports', 'setTimeout', ts.transpileModule(body, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(moduleExports, () => {});
const noop = () => {};
const form = { year: '1990', month: '1', day: '1', gender: 'male', clockHour: '8', clockMinute: '0' };
async function consume(chunks: Uint8Array[]) {
  let text = '';
  let failed = false;
  await moduleExports.makeRun({
    chartA: {}, chartB: {}, formA: form, formB: form,
    generateChart: async () => ({}), formToBirthInfo: () => ({}),
    setChartA: noop, setChartB: noop, setFormError: noop, setAnalyzing: noop,
    setAnalysis: (value: string) => { text = value; },
    setAnalysisError: (value: boolean) => { failed = value; },
    setNotConfiguredNotice: noop, readNotConfiguredNotice,
  setRateLimitNotice: noop, readRateLimitNotice, readSseText, analysisRef: { current: null }, abortRef: { current: null },
    fetch: async () => ({ status: 200, ok: true, body: new ReadableStream({
      start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); },
    }) }),
  })();
  assert.equal(failed, false);
  return text;
}
async function main() {
  for (const ending of ['\n', '\r\n']) {
    const bytes = new TextEncoder().encode(
      `data: {"delta":{"text":"你好"}}${ending}${ending}` +
      `data: {"delta":{"text":"世界"}}${ending}${ending}data: [DONE]${ending}${ending}`,
    );
    assert.equal(await consume([bytes]), '你好世界');
    for (let cut = 1; cut < bytes.length; cut++) {
      assert.equal(await consume([bytes.slice(0, cut), bytes.slice(cut)]), '你好世界', `byte split ${cut}`);
    }
    assert.equal(await consume(Array.from(bytes, byte => Uint8Array.of(byte))), '你好世界');
  }
  let notice: string | null = null;
  await moduleExports.makeRun({
    chartA: {}, chartB: {}, formA: form, formB: form,
    generateChart: async () => ({}), formToBirthInfo: () => ({}),
    setChartA: noop, setChartB: noop, setFormError: noop, setAnalyzing: noop,
    setAnalysis: noop, setAnalysisError: noop,
    setNotConfiguredNotice: (value: string | null) => { notice = value; },
    readNotConfiguredNotice, setRateLimitNotice: noop, readRateLimitNotice, readSseText, analysisRef: { current: null }, abortRef: { current: null },
    fetch: async () => Response.json({ error: 'ai-not-configured', missing: 'DEEPSEEK_API_KEY' }, { status: 503 }),
  })();
  assert.match(notice ?? '', /\.env\.local[\s\S]*AI_PROVIDER[\s\S]*DEEPSEEK_API_KEY/, '503 shows the setup hint');
  let limitNotice: string | null = null;
  await moduleExports.makeRun({
    chartA: {}, chartB: {}, formA: form, formB: form,
    generateChart: async () => ({}), formToBirthInfo: () => ({}),
    setChartA: noop, setChartB: noop, setFormError: noop, setAnalyzing: noop,
    setAnalysis: noop, setAnalysisError: noop, setNotConfiguredNotice: noop, readNotConfiguredNotice,
    setRateLimitNotice: (value: string | null) => { limitNotice = value; }, readRateLimitNotice, readSseText,
    analysisRef: { current: null }, abortRef: { current: null },
    fetch: async () => Response.json({ error: 'rate-limited', retryAfter: 90 }, { status: 429, headers: { 'Retry-After': '90' } }),
  })();
  assert.equal(limitNotice, 'AI 解读请求太频繁，请约 2 分钟后再试。命盘本身不受影响。', '429 says how long to wait');
  // 开始新一次分析时取消上一次：旧请求不报错，加载状态交给新的一次
  const abortRef = { current: null as AbortController | null };
  const signals: AbortSignal[] = [];
  let analyzing = false;
  let errored = false;
  let releaseSecond = () => {};
  const runs = moduleExports.makeRun({
    chartA: {}, chartB: {}, formA: form, formB: form,
    generateChart: async () => ({}), formToBirthInfo: () => ({}),
    setChartA: noop, setChartB: noop, setFormError: noop,
    setAnalyzing: (v: boolean) => { analyzing = v; }, setAnalysis: noop,
    setAnalysisError: (v: boolean) => { errored = errored || v; },
    setNotConfiguredNotice: noop, readNotConfiguredNotice, setRateLimitNotice: noop, readRateLimitNotice,
    readSseText, analysisRef: { current: null }, abortRef,
    fetch: (_url: string, init: { signal: AbortSignal }) => {
      signals.push(init.signal);
      const first = signals.length === 1;
      return new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        if (!first) releaseSecond = () => resolve(new Response('data: {"delta":{"text":"新"}}\n\ndata: [DONE]\n\n'));
      });
    },
  });
  const firstRun = runs();
  await new Promise(r => setTimeout(r, 0));
  const secondRun = runs();
  await firstRun;
  assert.equal(signals[0].aborted, true, 'the first request is aborted');
  assert.equal(errored, false, 'an aborted request is not shown as a failure');
  assert.equal(analyzing, true, 'the second run still owns the loading state');
  await new Promise(r => setTimeout(r, 0));
  releaseSecond();
  await secondRun;
  assert.equal(analyzing, false);
  assert.equal(abortRef.current, null);

  console.log('Heming SSE byte-fragment regressions passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
