/**
 * BirthForm → BirthInfo 转换一致性回归
 *
 * 背景：`BirthFormState → BirthInfo` 的转换在本仓库里必须只有一处实现——
 * `lib/ziwei/share.ts` 的 `formToBirthInfo()`，它负责「晚子时换日」：
 * 23:00–23:59 出生按**次日**排盘。这条规则是三处规格共同确定的：
 *   · `lib/ziwei/types.ts` 声明 `BirthInfo.year` 是「已经过子时换日修正后的排盘日」；
 *   · `README.md` 时辰对照表下一行：「23:00–23:59 出生（晚子时）按次日排盘、时辰取 0」；
 *   · `scripts/regression/iztro-time-index-boundary.test.ts` 已把它钉成断言。
 *
 * 但 `components/BirthForm.tsx` 的 `handleSubmit` 曾经自行拼装 BirthInfo，
 * `year/month/day` 直接用表单原值，绕过了换日。于是同一次出生输入：
 *   · `/chart`（`BirthForm.onSubmit` → `generateChart`）排出「填的那天」的盘；
 *   · `/heming`（`formToBirthInfo` → `generateChart`）排出「次日」的盘。
 * 两条路径相差一整天，整张命盘（十二宫、星曜、四化）都不一样。
 *
 * 本回归钉住三件事：
 *   1. BirthForm 必须复用 `formToBirthInfo`，不得自行拼装 BirthInfo；
 *   2. BirthForm 不得再带一份自己的 `calcTrueSolarBranch`（真太阳时只有一处实现）；
 *   3. `formToBirthInfo` 的晚子时 / 早子时边界行为，含跨月与跨年进位。
 *
 * 第 1、2 条走源码解析（组件是 .tsx，仓库没有 DOM 测试环境），
 * 与 `famous-hour-consistency.test.ts` 同一做法。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formToBirthInfo } from '../../lib/ziwei/share';
import type { BirthFormState } from '../../components/BirthForm';

const src = readFileSync(new URL('../../components/BirthForm.tsx', import.meta.url), 'utf8');

// ── 1) 转换只有一处实现：BirthForm 必须复用 share.ts ──────────────
assert.match(
  src,
  /import\s*\{[^}]*\bformToBirthInfo\b[^}]*\}\s*from\s*'@\/lib\/ziwei\/share'/,
  'BirthForm 必须从 @/lib/ziwei/share 引入 formToBirthInfo，不能自己拼 BirthInfo',
);

assert.equal(
  /onSubmit\(\s*\{/.test(src),
  false,
  'BirthForm 的 onSubmit 不应收到手拼的对象字面量——晚子时换日会因此被绕过，请改走 formToBirthInfo',
);

// ── 2) 真太阳时时辰只有一处实现 ─────────────────────────────────
assert.equal(
  /function\s+calcTrueSolarBranch\s*\(/.test(src),
  false,
  'BirthForm 不得重复实现 calcTrueSolarBranch，请复用 lib/ziwei/share.ts 的同名导出',
);

// ── 3) formToBirthInfo 的边界行为 ───────────────────────────────
function formAt(
  year: string,
  month: string,
  day: string,
  clockHour: string,
  clockMinute = '30',
  overrides: Partial<BirthFormState> = {},
): BirthFormState {
  return {
    name: '',
    year,
    month,
    day,
    clockHour,
    clockMinute,
    unknownTime: false,
    province: '',
    city: '',
    longitude: 120,
    gender: 'male',
    ...overrides,
  };
}

const pick = (b: ReturnType<typeof formToBirthInfo>) => ({
  year: b.year,
  month: b.month,
  day: b.day,
  hour: b.hour,
});

// 晚子时：按次日排盘、时辰取 0
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '23'))),
  { year: 2000, month: 2, day: 1, hour: 0 },
  '1/31 23:30 晚子时应排到 2/1、时辰支 0',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '12', '31', '23'))),
  { year: 2001, month: 1, day: 1, hour: 0 },
  '跨年：12/31 23:30 应排到次年 1/1',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '2', '28', '23'))),
  { year: 2000, month: 2, day: 29, hour: 0 },
  '闰年：2/28 23:30 应排到 2/29',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2001', '2', '28', '23'))),
  { year: 2001, month: 3, day: 1, hour: 0 },
  '平年：2/28 23:30 应排到 3/1',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '23', '0'))),
  { year: 2000, month: 2, day: 1, hour: 0 },
  '23:00 整点即进入晚子时',
);

// 早子时与 22:xx：不换日
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '0'))),
  { year: 2000, month: 1, day: 31, hour: 0 },
  '00:30 早子时留在本日、时辰支同为 0',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '22', '59'))),
  { year: 2000, month: 1, day: 31, hour: 11 },
  '22:59 是亥时，不应换日',
);

// 时辰不详：不换日、支取 0
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '23', '30', { unknownTime: true }))),
  { year: 2000, month: 1, day: 31, hour: 0 },
  '时辰不详时不应按晚子时换日',
);

console.log('✅ BirthForm→BirthInfo 转换一致性：单一实现 + 晚子时边界（跨月/跨年）均正确');
