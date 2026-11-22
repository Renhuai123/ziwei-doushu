'use client';

import type { BirthFormState } from '@/components/BirthForm';
import { useHistory } from '@/lib/ziwei/history';

/** 排盘表单上方的「最近排过」：点一条直接重排，× 删除单条，数据只在本机。 */
export default function RecentCharts({ onPick, disabled }: { onPick: (form: BirthFormState) => void; disabled?: boolean }) {
  const { history, remove, clear } = useHistory();
  if (history.length === 0) return null;

  return (
    <section aria-labelledby="recent-title" className="mb-6">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h2 id="recent-title" className="text-[13px] font-medium" style={{ color: 'var(--tx-1)' }}>最近排过</h2>
        <button
          type="button"
          onClick={clear}
          className="text-[12px] underline-offset-4 hover:underline focus-visible:underline"
          style={{ color: 'var(--tx-3)' }}
        >
          全部清除
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {history.map(entry => (
          <li key={entry.id} className="chip !pr-1 max-w-full">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(entry.form)}
              className="min-w-0 truncate tabular-nums disabled:opacity-50"
              title={`用这组出生信息重新排盘：${entry.label}`}
            >
              {entry.label}
            </button>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              aria-label={`删除记录：${entry.label}`}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--bar-bg)] hover:text-[var(--tx-0)]"
            >
              <span aria-hidden>×</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px]" style={{ color: 'var(--tx-3)' }}>只保存在这台设备的浏览器里，不会上传。</p>
    </section>
  );
}
