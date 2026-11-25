'use client';

import { useEffect, useRef, useState } from 'react';

/** 复制当前地址（含 # 后的出生信息）。复制失败时提示从地址栏手动复制。 */
export function CopyLinkButton({ label = '复制链接' }: { label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setState('copied');
    } catch {
      setState('failed');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2500);
  };

  return (
    <button type="button" className="chip shrink-0" onClick={copy} title="链接里带有这组出生信息，收到的人打开即可看到同一张盘">
      <span aria-hidden>⧉</span>
      <span aria-live="polite">{state === 'copied' ? '已复制' : state === 'failed' ? '请从地址栏复制' : label}</span>
    </button>
  );
}

/** 挂载时读一次地址里的 #：合法就交给 onFound；有内容但不合法（被改坏、截断）就调 onInvalid。只渲染在表单视图里。 */
export function RestoreFromHash<T>({ parse, onFound, onInvalid }: {
  parse: (hash: string) => T | null;
  onFound: (value: T) => void;
  onInvalid?: () => void;
}) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return; // StrictMode 下 effect 会跑两次
    done.current = true;
    if (location.hash.length <= 1) return;
    const value = parse(location.hash);
    if (value) onFound(value);
    else onInvalid?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
