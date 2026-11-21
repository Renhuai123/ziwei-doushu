'use client';
import { useEffect, useState } from 'react';
import { TOPIC_LABEL, type TopicKey } from '@/lib/ziwei/db-analysis';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { ReadingResult } from '@/lib/readings/types';

const TOPICS = Object.keys(TOPIC_LABEL) as TopicKey[];

type State = { phase: 'loading' } | { phase: 'error' } | { phase: 'done'; result: ReadingResult };

function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        const section = line.match(/^\*\*【(.+?)】\*\*$/);
        if (section) {
          return (
            <div key={i} className="pt-4 pb-0.5 first:pt-0 text-[13px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
              【{section[1]}】
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--t-text2)', whiteSpace: 'pre-wrap' }}>
            {parts.map((part, j) => (j % 2 === 0
              ? part
              : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>))}
          </div>
        );
      })}
    </div>
  );
}

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
    body = <p className="text-[13px]" style={{ color: 'var(--t-text2)' }}>正在查找你的命盘解读…</p>;
  } else if (state.phase === 'error') {
    body = <p className="text-[13px]" style={{ color: 'var(--t-text2)' }}>解读加载失败，请稍后重试。</p>;
  } else if (state.result.status === 'out-of-range') {
    const [from, to] = state.result.range;
    body = <p className="text-[13px]" style={{ color: 'var(--t-text2)' }}>数据集目前只覆盖 {from} 至 {to} 年出生的命盘，这张盘不在范围内。</p>;
  } else if (state.result.status === 'unavailable') {
    body = (
      <p className="text-[13px]" style={{ color: 'var(--t-text2)' }}>
        解读索引尚未构建。请先运行 <code>node scripts/readings/build-shards.mjs</code>。
      </p>
    );
  } else {
    const { reading } = state.result;
    body = (
      <>
        <div role="tablist" aria-label="解读主题" className="flex flex-wrap gap-1.5 mb-4">
          {TOPICS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === topic}
              onClick={() => setTopic(k)}
              className="rounded-lg px-3 py-1 text-[12px] cursor-pointer"
              style={{
                border: '1px solid var(--t-gold)',
                background: k === topic ? 'var(--t-gold)' : 'transparent',
                color: k === topic ? 'var(--t-bg, #000)' : 'var(--t-gold)',
              }}
            >
              {TOPIC_LABEL[k]}
            </button>
          ))}
        </div>
        <Markdown text={reading.topics[topic]} />
      </>
    );
  }

  return (
    <section className="card-glass rounded-xl p-5" style={{ marginTop: 20 }}>
      <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--t-text)' }}>命盘解读</h2>
      {body}
      <p className="text-[11px] mt-5 leading-relaxed" style={{ color: 'var(--t-text2)', opacity: 0.8 }}>
        解读数据来自 ziwei-doushu 项目（github.com/Renhuai123/ziwei-doushu）v4.0 本命盘解读，采用 CC BY 4.0 许可。
        其中引用的倪海厦《天纪》原文不在该许可范围内。
      </p>
    </section>
  );
}
