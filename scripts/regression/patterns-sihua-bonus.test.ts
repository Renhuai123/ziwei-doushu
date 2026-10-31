/**
 * 格局加分项里的「化禄 / 化权 / 化科」要按星曜的 siHua 字段判，不是按星名。
 *
 * 四化挂在 Star.siHua 上（如 { name: '天机', siHua: '科' }），盘上没有叫「化科」的星。
 * 早先府相朝垣「命宫见禄」、阳梁昌禄 / 机月同梁「再会化科」、杀破狼「三方有化禄或化权」
 * 用 hasStar / sanFangAllStars 查「化X」星名，永远查不到，这几条加分项从来不会出现。
 *
 * patterns.ts 带 `server-only`（仓库里没装这个包，Next 构建时才有），这里先把它解析成空模块再 import。
 */
import assert from 'node:assert/strict';
import * as nodeModule from 'node:module';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { ZiweiChart, SiHua } from '../../lib/ziwei/types';

// module.registerHooks：Node 22.15+ / 23.5+；@types/node 20 还没有它的声明，这里自带最小类型
type HookResult = { url?: string; format?: string; source?: string; shortCircuit?: boolean };
const { registerHooks } = nodeModule as unknown as {
  registerHooks(hooks: {
    resolve(specifier: string, context: unknown, next: (s: string, c: unknown) => HookResult): HookResult;
    load(url: string, context: unknown, next: (u: string, c: unknown) => HookResult): HookResult;
  }): void;
};
const SERVER_ONLY_STUB = 'data:text/javascript,';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') return { url: SERVER_ONLY_STUB, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === SERVER_ONLY_STUB) return { format: 'commonjs', source: '', shortCircuit: true };
    return nextLoad(url, context);
  },
});

function sanFangHasSiHua(chart: ZiweiChart, hua: SiHua): boolean {
  const m = chart.mingGongBranch;
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return chart.palaces.some(p => branches.includes(p.branch) && p.stars.some(s => s.siHua === hua));
}

async function main() {
const { detectPatterns } = await import('../../lib/ziwei/patterns');

// 盘上不存在名为「化X」的星
const sample = generateChart({ year: 1988, month: 10, day: 8, hour: 7, gender: 'male' });
assert.ok(sample.palaces.every(p => p.stars.every(s => !/^化[禄权科忌]$/.test(s.name))), '星名里出现了「化X」');

// 逐日扫一年、固定午时，统计每个加分项「该出现」与「实际出现」的盘数
const checks: { pattern: string; bonus: string; expect: (c: ZiweiChart) => boolean }[] = [
  {
    pattern: '府相朝垣', bonus: '命宫见禄',
    expect: c => c.palaces.some(p => p.branch === c.mingGongBranch && p.stars.some(s => s.name === '禄存' || s.siHua === '禄')),
  },
  { pattern: '杀破狼', bonus: '三方有化禄或化权（动得有力）', expect: c => sanFangHasSiHua(c, '禄') || sanFangHasSiHua(c, '权') },
  { pattern: '机月同梁', bonus: '再会化科', expect: c => sanFangHasSiHua(c, '科') },
  { pattern: '阳梁昌禄', bonus: '再会化科', expect: c => sanFangHasSiHua(c, '科') },
];
const hits = new Map<string, number>();
const start = Date.UTC(1990, 0, 1);
for (let d = 0; d < 366; d++) {
  const dt = new Date(start + d * 86_400_000);
  const chart = generateChart({
    year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate(), hour: 6, gender: 'male',
  });
  const found = detectPatterns(chart);
  for (const { pattern, bonus, expect } of checks) {
    const p = found.find(x => x.name === pattern);
    if (!p) continue;
    const want = expect(chart);
    const got = p.conditions?.bonus?.includes(bonus) ?? false;
    assert.equal(got, want, `${dt.toISOString().slice(0, 10)} 午时 ${pattern}「${bonus}」应为 ${want}`);
    if (got) hits.set(pattern, (hits.get(pattern) ?? 0) + 1);
  }
}
for (const { pattern } of checks) {
  assert.ok((hits.get(pattern) ?? 0) > 0, `${pattern} 的四化加分项一次都没触发，样本覆盖不到或判断仍按星名`);
}

console.log(`✓ 格局四化加分项按 siHua 判定（触发盘数：${[...hits].map(([k, v]) => `${k} ${v}`).join('、')}）`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
