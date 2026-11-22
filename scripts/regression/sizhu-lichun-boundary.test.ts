/**
 * 节气四柱 立春/节气边界精确到时刻 — 回归测试
 *
 * 背景（2026-09-01）：会员反馈「紫薇排盘里给我排的四柱不准…年柱为癸未…立春是19点…我不是甲申年」。
 * 查证：农历2004正月十四=公历2004-02-04，立春2004=当天19:56，会员凌晨2:40（丑时）出生在立春前，
 * 八字年柱应为癸未（连带月柱乙丑），排盘却给甲申/丙寅。
 * 根因：节气四柱原用 lunar-javascript 的 getYearGanByLiChun()/getMonthGan()，是「按立春当天整天」切换、
 * 不看时刻（实测即使传入时间也无效），立春当天凌晨出生的被算进新年。
 * 修复：改用 getEightChar()（精确到立春/节的时刻），时刻用时辰中点(index*2)近似。
 *
 * 本测试锁住：①会员案例修对 ②非节气日不被误伤 ③立春当天「前/后」正确分档。
 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';

let passed = 0;
const ok = (name: string, cond: boolean) => { assert.ok(cond, `❌ ${name}`); console.log(`  ✅ ${name}`); passed++; };
const sizhu = (y: number, mo: number, d: number, h: number) =>
  generateChart({ year: y, month: mo, day: d, hour: h, gender: 'male' }).lunarInfo;

// ① 会员案例：2004-02-04 丑时(立春19:56前) → 节气年柱癸未、月柱乙丑
const m = sizhu(2004, 2, 4, 1);
ok('会员案例 节气四柱年柱=癸未（立春前，不是甲申）', m.fourPillars?.[0] === '癸未');
ok('会员案例 节气四柱月柱=乙丑（连带修正，不是丙寅）', m.fourPillars?.[1] === '乙丑');
ok('会员案例 非节气四柱年柱=甲申（农历正月初一口径，保持不变）', m.fourPillarsLunar?.[0] === '甲申');

// ② 立春前一天/后一天：边界两侧正确
ok('2004-02-03 丑时（立春前一天）节气年柱=癸未', sizhu(2004, 2, 3, 1).fourPillars?.[0] === '癸未');
ok('2004-02-05 丑时（立春后一天）节气年柱=甲申', sizhu(2004, 2, 5, 1).fourPillars?.[0] === '甲申');

// ③ 立春当天「时刻前 vs 时刻后」正确分档（同一天不同时辰）
//    立春=19:56（戌时19-21）。丑时(idx1=02点)在前→癸未；亥时(idx11=22点)在后→甲申。
ok('2004-02-04 丑时(立春前) → 癸未', sizhu(2004, 2, 4, 1).fourPillars?.[0] === '癸未');
ok('2004-02-04 亥时(立春后) → 甲申', sizhu(2004, 2, 4, 11).fourPillars?.[0] === '甲申');

// ④ 非节气日不被误伤（固定期望值，防回归时被动）
const c = sizhu(1990, 6, 15, 6);
ok('非节气日 1990-06-15 午时 节气四柱稳定=庚午/壬午/辛亥/甲午',
   JSON.stringify(c.fourPillars) === JSON.stringify(['庚午', '壬午', '辛亥', '甲午']));

// ⑤ 日柱、时柱不受立春影响（会员案例日柱癸丑、时柱癸丑）
ok('日柱不受立春边界影响（会员案例=癸丑）', m.fourPillars?.[2] === '癸丑');
ok('时柱不受立春边界影响（会员案例丑时=癸丑）', m.fourPillars?.[3] === '癸丑');

console.log(`\n[sizhu-lichun-boundary] ${passed} 项断言全部通过`);
