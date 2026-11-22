'use client';
import { useEffect, useRef, useState } from 'react';
import { TOPIC_LABEL, type TopicKey } from '@/lib/ziwei/db-analysis';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { ReadingResult } from '@/lib/readings/types';
import ReadingMarkdown from './ReadingMarkdown';
import SkeletonLines from './SkeletonLines';

const TOPICS = Object.keys(TOPIC_LABEL) as TopicKey[];

type State = { phase: 'loading' } | { phase: 'error' } | { phase: 'done'; result: ReadingResult };
/** 已返回的结果连同它对应的请求；请求变了（换盘或重试）而结果还没回来时即为加载中。 */
type Settled = { key: string; state: State };

const muted = { color: 'var(--tx-2)' } as const;

export default function ReadingsPanel({ chart }: { chart: ZiweiChart }) {
  const [settled, setSettled] = useState<Settled | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [topic, setTopic] = useState<TopicKey>('overview');
  const articleRef = useRef<HTMLElement>(null);
  // 已经读到正文中段时切换主题，回到新主题开头（标签栏是 sticky 的，滚过去后仍可点）
  const selectTopic = (k: TopicKey) => {
    setTopic(k);
    const el = articleRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  };
  const { year, month, day, hour, gender } = chart.birthInfo;

  const requestKey = `${year}-${month}-${day}-${hour}-${gender}-${attempt}`;
  const state: State = settled?.key === requestKey ? settled.state : { phase: 'loading' };

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, day, hour, gender }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<ReadingResult>) : Promise.reject(new Error(String(r.status)))))
      .then((result) => setSettled({ key: requestKey, state: { phase: 'done', result } }))
      .catch((e) => { if (!ctrl.signal.aborted) { console.error(e); setSettled({ key: requestKey, state: { phase: 'error' } }); } });
    return () => ctrl.abort();
  }, [year, month, day, hour, gender, attempt, requestKey]);

  let body: React.ReactNode;
  if (state.phase === 'loading') {
    body = <SkeletonLines widths={[92, 100, 84, 96, 60]} label="正在载入解读" />;
  } else if (state.phase === 'error') {
    body = (
      <div role="alert" className="flex flex-wrap items-center gap-3">
        <p className="text-[14px]" style={muted}>解读没能加载出来，可能是网络一时不稳。</p>
        <button type="button" className="chip" onClick={() => setAttempt(a => a + 1)}>重试</button>
      </div>
    );
  } else if (state.result.status === 'out-of-range') {
    const [from, to] = state.result.range;
    body = <p className="text-[13px]" style={muted}>数据集目前只覆盖 {from} 至 {to} 年出生的命盘，这张盘不在范围内。</p>;
  } else if (state.result.status === 'unavailable') {
    body = (
      <p className="text-[13px]" style={muted}>
        解读索引尚未构建。请先运行 <code>node scripts/readings/build-shards.mjs</code>。
      </p>
    );
  } else {
    const { reading } = state.result;
    body = (
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <div
          role="tablist"
          aria-label="解读主题"
          aria-orientation="vertical"
          className="sticky top-14 z-10 -mx-4 flex gap-1 overflow-x-auto px-4 py-2 lg:top-20 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0 lg:py-0 max-lg:bg-[var(--case-to)] max-lg:border-b max-lg:border-[var(--bdr)]"
        >
          {TOPICS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === topic}
              onClick={() => selectTopic(k)}
              className="topic-link !w-auto lg:!w-full shrink-0 lg:shrink whitespace-nowrap cursor-pointer"
            >
              {TOPIC_LABEL[k]}
            </button>
          ))}
        </div>
        <article ref={articleRef} key={topic} role="tabpanel" aria-label={TOPIC_LABEL[topic]} className="min-w-0 animate-fade-in scroll-mt-32 lg:scroll-mt-24">
          <ReadingMarkdown text={reading.topics[topic]} />
        </article>
      </div>
    );
  }

  return (
    <section className="card-glass rounded-2xl p-4 sm:p-8 mt-8" aria-labelledby="readings-title">
      <header className="mb-6 sm:mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="eyebrow mb-2">本命盘解读</p>
          <h2 id="readings-title" className="text-[22px] font-semibold" style={{ color: 'var(--tx-0)' }}>
            十三个主题，逐项细读
          </h2>
        </div>
      </header>
      {body}
      <p className="text-[11px] mt-10 pt-5 leading-relaxed" style={{ color: 'var(--tx-3)', borderTop: '1px solid var(--bdr)' }}>
        解读数据来自 ziwei-doushu 项目（github.com/Renhuai123/ziwei-doushu）v4.0 本命盘解读，采用 CC BY 4.0 许可。
        其中引用的倪海厦《天纪》原文不在该许可范围内。
      </p>
    </section>
  );
}
