/**
 * 给 iztro 的 kot() 加缓存。
 *
 * kot(value, k) 把翻译后的文字反查回 i18n 键（如「甲」→ jiaHeavenly）。iztro 每次调用都把
 * 所有语言的整张翻译表从头扫一遍，排一张盘要调用上百次，占了排盘约七成的时间。
 * 结果只取决于 value、k 和 iztro 内置的静态翻译表，同样的参数永远返回同样的键，可以放心缓存。
 *
 * iztro 内部都是以 `(0, i18n_1.kot)(…)` 在调用时读取导出对象，所以替换导出对象上的 kot 即可生效。
 * 如果打包方式让导出对象不可写，就保持原函数，排盘结果不受影响，只是没有加速。
 * iztro 升级后若改了 kot 的写法，scripts/regression/iztro-kot-cache.test.ts 会提醒重新确认。
 */
type Kot = (value: string, k?: string) => unknown;

// 必须用 require 拿到 iztro 真正的导出对象：`import * as` 在 tsx / 打包器里得到的是只读副本，改了不生效
// eslint-disable-next-line @typescript-eslint/no-require-imports
const target: { kot: Kot } = require('iztro/lib/i18n');
const original = target.kot;
const cache = new Map<string, unknown>();
// 键来自固定的星曜、干支、宫位等名称，数量有限；万一传进来的值不受控也不会无限增长
const MAX_ENTRIES = 5000;

function cachedKot(value: string, k?: string): unknown {
  const key = `${k ?? ''}\u0000${value}`;
  if (cache.has(key)) return cache.get(key);
  const result = original(value, k);
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(key, result);
  return result;
}

try {
  target.kot = cachedKot as Kot;
} catch { /* 导出对象只读：保持原函数 */ }

/** 缓存是否已接上（测试与排查用）。 */
export const kotCacheActive = target.kot === (cachedKot as Kot);
/** 测试用：原始的 kot 与缓存条数。 */
export const uncachedKot = original;
export const kotCacheSize = () => cache.size;
