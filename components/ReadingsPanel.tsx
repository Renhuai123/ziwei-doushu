'use client';
import { useEffect, useState } from 'react';
import { TOPIC_LABEL, type TopicKey } from '@/lib/ziwei/db-analysis';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { ReadingResult } from '@/lib/readings/types';

const TOPICS = Object.keys(TOPIC_LABEL) as TopicKey[];

type State = { phase: 'loading' } | { phase: 'error' } | { phase: 'done'; result: ReadingResult };

function Markdown({ text }: { text: string }) {
  return (
    <div className="reading-prose">
      {text.split('\n').map((line, i) => {
        const section = line.match(/^\*\*【(.+?)】\*\*$/);
        if (section) return <h3 key={i}>{section[1]}</h3>;
        if (line.trim() === '') return null;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <p key={i} style={{ whiteSpace: 'pre-wrap' }}>
            {parts.map((part, j) => (j % 2 === 0 ? part : <strong key={j}>{part}</strong>))}
          </p>
        );
      })}
    </div>
  );
}

const muted = { color: 'var(--tx-2)' } as const;

export default function ReadingsPanel({ chart }: { chart: ZiweiChart }) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [topic, setTopic] = useState<TopicKey>('overview');
  const { year, month, day, hour, gender } = chart.birthInfo;

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ phase: 'loading' });
    fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, day, hour, gender }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<ReadingResult>) : Promise.reject(new Error(String(r.status)))))
      .then((result) => setState({ phase: 'done', result }))
      .catch((e) => { if (!ctrl.signal.aborted) { console.error(e); setState({ phase: 'error' }); } });
    return () => ctrl.abort();
  }, [year, month, day, hour, gender]);

  let body: React.ReactNode;
  if (state.phase === 'loading') {
    body = (
      <div className="space-y-3" aria-busy="true" aria-label="正在载入解读">
        {[92, 100, 84, 96, 60].map((w, i) => (
          <div key={i} className="h-3 rounded-full animate-pulse" style={{ width: `${w}%`, background: 'var(--bg-2)' }} />
        ))}
      </div>
    );
  } else if (state.phase === 'error') {
    body = <p className="text-[13px]" style={muted}>解读加载失败，请稍后重试。</p>;
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
          className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1 lg:flex-col lg:overflow-visible lg:sticky lg:top-20 lg:self-start"
        >
          {TOPICS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === topic}
              onClick={() => setTopic(k)}
              className="topic-link shrink-0 lg:shrink whitespace-nowrap cursor-pointer"
            >
              {TOPIC_LABEL[k]}
            </button>
          ))}
        </div>
        <article key={topic} role="tabpanel" aria-label={TOPIC_LABEL[topic]} className="min-w-0 animate-fade-in">
          <Markdown text={reading.topics[topic]} />
        </article>
      </div>
    );
  }

  return (
    <section className="card-glass rounded-2xl p-5 sm:p-8 mt-8" aria-labelledby="readings-title">
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
