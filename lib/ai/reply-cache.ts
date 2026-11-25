/**
 * Client-safe: caches complete AI replies in sessionStorage so refreshing a chart
 * (which re-sends the same 命格总览 request) doesn't pay for and wait on the same
 * answer again. It lives only in this tab and clears when the tab closes.
 *
 * The key covers everything the server sees: the birth data the chart is rebuilt
 * from, the whole conversation so far, and today's date (the reading talks about
 * the current 大限 and 流年).
 */
const STORAGE_KEY = 'ziwei_ai_replies';
const MAX_ENTRIES = 30;

type Entry = { k: string; v: string };

function hash(text: string): string {
  // FNV-1a 32-bit, twice with different seeds: short keys, collisions negligible at this size
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x5bd1e995);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}

export function replyKey(birthInfo: unknown, messages: unknown, today = new Date()): string {
  const day = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  return hash(JSON.stringify([birthInfo, messages, day]));
}

function read(): Entry[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((e): e is Entry => typeof e?.k === 'string' && typeof e?.v === 'string')
      : [];
  } catch {
    return [];
  }
}

export function getCachedReply(key: string): string | null {
  return read().find(e => e.k === key)?.v ?? null;
}

export function cacheReply(key: string, text: string): void {
  const entries = [...read().filter(e => e.k !== key), { k: key, v: text }].slice(-MAX_ENTRIES);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* storage full or blocked: just don't cache */ }
}
