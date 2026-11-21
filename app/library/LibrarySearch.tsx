'use client';

/**
 * 古籍库搜索框 — client component
 * 提交后跳转 /library/search?q=xxx
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function LibrarySearch({ defaultValue = '' }: { defaultValue?: string }) {
  const [q, setQ] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    startTransition(() => {
      router.push(`/library/search?q=${encodeURIComponent(query)}`);
    });
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className="flex items-center gap-2 rounded-xl p-1.5 transition-colors focus-within:border-[var(--ac-bdr)]"
      style={{ background: 'var(--bg-1)', border: '1px solid var(--bdr-med)' }}
    >
      <label htmlFor="library-q" className="sr-only">搜索古籍原文</label>
      <input
        id="library-q"
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="搜索古籍原文，如：七杀朝斗 / 双禄朝垣 / 化忌"
        className="min-w-0 flex-1 bg-transparent px-3 h-10 text-[15px] outline-none"
        style={{ color: 'var(--tx-0)' }}
      />
      <button
        type="submit"
        disabled={isPending || !q.trim()}
        className="h-10 shrink-0 rounded-lg px-5 text-[14px] font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--ac)', color: 'var(--bg-0)' }}
      >
        {isPending ? '搜索中…' : '搜索'}
      </button>
    </form>
  );
}
