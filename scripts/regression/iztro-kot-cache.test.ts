/**
 * iztro kot() 缓存：必须真的接上，并且对所有翻译文字都与原函数返回同样的键。
 * iztro 升级后如果改了 kot 的调用方式，这里会失败，提醒重新确认 lib/ziwei/iztro-kot-cache.ts。
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { generateChart } from '../../lib/ziwei/algorithm';
import { kotCacheActive, kotCacheSize, uncachedKot } from '../../lib/ziwei/iztro-kot-cache';

const require = createRequire(import.meta.url);
const i18n = require('iztro/lib/i18n') as {
  kot: (value: string, k?: string) => unknown;
  default: { store: { data: Record<string, { translation: Record<string, string> }> } };
};

assert.equal(kotCacheActive, true, 'the cache must replace iztro\'s exported kot');
assert.notEqual(i18n.kot, uncachedKot);

// iztro 排盘时确实经过缓存：排一张盘后缓存条数应增加（加载模块时 iztro 已先查过少量文字）
const before = kotCacheSize();
generateChart({ year: 1990, month: 6, day: 15, hour: 3, gender: 'male' });
assert.ok(kotCacheSize() > before, 'chart generation goes through the cached kot');

// 所有语言的全部翻译文字，配上 iztro 实际用到的几种 k，结果与原函数逐一相同（第二次走缓存也一样）
const values = new Set<string>(['男', '女', 'male', 'female', '不存在的文字']);
for (const { translation } of Object.values(i18n.default.store.data)) {
  for (const v of Object.values(translation)) if (typeof v === 'string') values.add(v);
}
const ks = [undefined, 'Heavenly', 'Earthly', 'Palace', 'Maj', 'Min'];
let checked = 0;
for (const v of values) {
  for (const k of ks) {
    const expected = uncachedKot(v, k);
    assert.deepEqual(i18n.kot(v, k), expected, `kot(${v}, ${k})`);
    assert.deepEqual(i18n.kot(v, k), expected, `kot(${v}, ${k}) from cache`);
    checked++;
  }
}

console.log(`iztro kot cache passed (${checked} lookups match the original)`);
