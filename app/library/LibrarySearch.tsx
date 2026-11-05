'use client';

/**
 * 古籍库搜索框 — client component
 *
 * 输入 → 实时搜索 → 跳转 /library/search?q=xxx
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function LibrarySearch() {
  const [q, setQ] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    const query = q.trim();
    if (!query) return;
    startTransition(() => {
      router.push(`/library/search?q=${encodeURIComponent(query)}`);
    });
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '6px',
      background: 'var(--bg-card)',
      border: '1px solid rgba(184,146,42,0.3)',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(184,146,42,0.08)',
    }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        aria-label="Tìm kiếm trong cổ thư"
        placeholder="Tìm từ khóa: Tử Vi / Hóa Kỵ / Thất Sát triều đẩu"
        style={{
          flex: 1,
          padding: '10px 14px',
          border: 'none',
          outline: 'none',
          fontSize: '14px',
          color: 'var(--tx-0)',
          background: 'transparent',
        }}
      />
      <button
        onClick={submit}
        disabled={isPending || !q.trim()}
        style={{
          padding: '10px 22px',
          borderRadius: '8px',
          border: 'none',
          background: 'linear-gradient(135deg, #d4a948 0%, #b8922a 100%)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          cursor: q.trim() ? 'pointer' : 'not-allowed',
          opacity: q.trim() ? 1 : 0.5,
        }}
      >
        {isPending ? 'Đang tìm…' : 'Tìm kiếm'}
      </button>
    </div>
  );
}
