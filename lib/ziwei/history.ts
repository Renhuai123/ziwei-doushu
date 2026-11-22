import { useCallback, useEffect, useState } from 'react';
import type { BirthFormState } from '@/components/BirthForm';

/**
 * 最近排过的盘：只存在本机 localStorage，不上传。
 * 排盘页用它做「一键重排」，隐私政策第 6 条说的「最近的命盘历史」就是这份数据。
 */
const STORAGE_KEY = 'ziwei_history';
const MAX_ENTRIES = 6;

export interface HistoryEntry {
  id: string;
  label: string;
  form: BirthFormState;
  savedAt: number;
}

const sameBirth = (a: BirthFormState, b: BirthFormState) =>
  a.year === b.year && a.month === b.month && a.day === b.day && a.gender === b.gender &&
  a.unknownTime === b.unknownTime && a.clockHour === b.clockHour && a.clockMinute === b.clockMinute &&
  a.longitude === b.longitude && a.name.trim() === b.name.trim();

export function historyLabel(form: BirthFormState): string {
  const time = form.unknownTime ? '时辰不详' : `${form.clockHour.padStart(2, '0')}:${form.clockMinute.padStart(2, '0')}`;
  return [
    form.name.trim(),
    `${form.year}.${form.month}.${form.day} ${time}`,
    form.city || form.province,
    form.gender === 'male' ? '男' : '女',
  ].filter(Boolean).join(' · ');
}

/** 读历史；只接受结构完整的条目，旧版本或被手改的数据直接丢掉。 */
export function readHistory(): HistoryEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((e): e is HistoryEntry =>
      typeof e?.id === 'string' && typeof e?.form?.year === 'string' && typeof e?.form?.gender === 'string',
    ).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* 隐私模式等不可写时静默 */ }
}

/** 记下一次成功起盘；同一份出生信息只留最新一条。 */
export function saveToHistory(form: BirthFormState): void {
  const entry: HistoryEntry = { id: `${Date.now()}`, label: historyLabel(form), form: { ...form }, savedAt: Date.now() };
  writeHistory([entry, ...readHistory().filter(e => !sameBirth(e.form, form))].slice(0, MAX_ENTRIES));
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => { setHistory(readHistory()); }, []);

  const remove = useCallback((id: string) => {
    const next = readHistory().filter(e => e.id !== id);
    writeHistory(next);
    setHistory(next);
  }, []);

  const clear = useCallback(() => {
    writeHistory([]);
    setHistory([]);
  }, []);

  return { history, remove, clear };
}
