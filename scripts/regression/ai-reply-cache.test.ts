import assert from 'node:assert/strict';
import { cacheReply, getCachedReply, replyKey } from '../../lib/ai/reply-cache';

// node 没有 sessionStorage，用一个最小实现代替
const store = new Map<string, string>();
let blocked = false;
Object.assign(globalThis, {
  sessionStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { if (blocked) throw new Error('QuotaExceededError'); store.set(k, v); },
  },
});

const birth = { year: 1990, month: 6, day: 15, hour: 3, gender: 'male' };
const ask = [{ role: 'user', content: '请生成命格总览' }];
const day = new Date(2026, 10, 22, 9);

// 同样的盘、同样的对话、同一天 → 同一个键；任一项不同 → 不同的键
const k = replyKey(birth, ask, day);
assert.equal(replyKey({ ...birth }, [...ask], new Date(2026, 10, 22, 23)), k);
assert.notEqual(replyKey({ ...birth, hour: 4 }, ask, day), k, 'different birth data');
assert.notEqual(replyKey({ ...birth, name: '乙' }, ask, day), k, 'the name reaches the prompt too');
assert.notEqual(replyKey(birth, [...ask, { role: 'assistant', content: 'x' }], day), k, 'different conversation');
assert.notEqual(replyKey(birth, ask, new Date(2026, 10, 23)), k, 'a new day (current 流年 / 大限 may change)');

assert.equal(getCachedReply(k), null);
cacheReply(k, '紫微坐命');
assert.equal(getCachedReply(k), '紫微坐命');
cacheReply(k, '更新后的解读');
assert.equal(getCachedReply(k), '更新后的解读', 'regenerating replaces the entry');

// 最多保留 30 条，最旧的先丢
for (let i = 0; i < 30; i++) cacheReply(`key${i}`, `v${i}`);
assert.equal(getCachedReply(k), null, 'the oldest entry is evicted');
assert.equal(getCachedReply('key29'), 'v29');
assert.equal(JSON.parse(store.get('ziwei_ai_replies')!).length, 30);

// 存储内容损坏或写不进去都不影响使用
store.set('ziwei_ai_replies', '{not json');
assert.equal(getCachedReply('key29'), null);
blocked = true;
assert.doesNotThrow(() => cacheReply('x', 'y'));
blocked = false;

console.log('AI reply cache passed');
