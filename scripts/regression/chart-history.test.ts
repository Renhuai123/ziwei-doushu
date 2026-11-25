/** 最近排过的盘：去重、上限、坏数据容错（数据只在 localStorage）。 */
import assert from 'node:assert/strict';
import type { BirthFormState } from '../../components/BirthForm';
import { historyLabel, readHistory, saveToHistory } from '../../lib/ziwei/history';

const store = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
  },
});

const base: BirthFormState = {
  name: '', year: '1990', month: '6', day: '15', clockHour: '8', clockMinute: '0', unknownTime: false,
  province: '', city: '', longitude: 120, gender: 'male',
};

assert.deepEqual(readHistory(), [], 'empty storage reads as no history');

saveToHistory(base);
saveToHistory({ ...base });
assert.equal(readHistory().length, 1, 'same birth details are stored once');

saveToHistory({ ...base, clockHour: '9' });
assert.equal(readHistory()[0].form.clockHour, '9', 'newest entry comes first');
assert.equal(readHistory().length, 2, 'a different hour is a different chart');

for (let d = 1; d <= 10; d++) saveToHistory({ ...base, day: String(d) });
assert.equal(readHistory().length, 6, 'history is capped');

assert.equal(historyLabel({ ...base, name: ' 小明 ', city: '上海' }), '小明 · 1990.6.15 08:00 · 上海 · 男');
assert.equal(historyLabel({ ...base, unknownTime: true, gender: 'female' }), '1990.6.15 时辰不详 · 女');

store.set('ziwei_history', '{"not":"an array"}');
assert.deepEqual(readHistory(), [], 'non-array data is ignored');
store.set('ziwei_history', JSON.stringify([{ id: 1 }, { id: 'ok', form: base }]));
assert.equal(readHistory().length, 1, 'malformed entries are dropped');
store.set('ziwei_history', '{broken');
assert.deepEqual(readHistory(), [], 'invalid JSON is ignored');

console.log('✓ chart history: dedupe, cap, labels and corrupt-data tolerance');
