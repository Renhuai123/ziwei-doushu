/** Regression coverage for 岁前/将前/博士十二神接入排盘输出（issue #73）。 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { BRANCHES } from '../../lib/ziwei/constants';
import {
  SUI_QIAN_SHEN, JIANG_QIAN_SHEN, BOSHI_SHEN,
  suiQianShenByBranch, jiangQianShenByBranch, boshiShenByStem, jiangXingBranch,
} from '../../lib/ziwei/shier-shen';

// ── 单元：岁前十二神，岁建落起点支、顺行十二宫 ──
const suiZi = suiQianShenByBranch(0); // 子年
assert.equal(SUI_QIAN_SHEN[suiZi[0]], '岁建', '子年子宫应为岁建');
assert.equal(SUI_QIAN_SHEN[suiZi[1]], '晦气', '子年丑宫应为晦气');
assert.equal(SUI_QIAN_SHEN[suiZi[6]], '岁破', '岁破必在岁建对宫');
assert.equal(SUI_QIAN_SHEN[suiZi[7]], '龙德', '子年未宫应为龙德');

// ── 单元：将前十二神，将星起三合帝旺位 ──
// 申子辰→子、寅午戌→午、巳酉丑→酉、亥卯未→卯
assert.equal(jiangXingBranch(0), 0, '子年将星在子');
assert.equal(jiangXingBranch(4), 0, '辰年将星在子');
assert.equal(jiangXingBranch(8), 0, '申年将星在子');
assert.equal(jiangXingBranch(2), 6, '寅年将星在午');
assert.equal(jiangXingBranch(5), 9, '巳年将星在酉');
assert.equal(jiangXingBranch(11), 3, '亥年将星在卯');
const jiangZi = jiangQianShenByBranch(0);
assert.equal(JIANG_QIAN_SHEN[jiangZi[0]], '将星', '子年子宫应为将星');
assert.equal(JIANG_QIAN_SHEN[jiangZi[1]], '攀鞍', '子年丑宫应为攀鞍');
assert.equal(JIANG_QIAN_SHEN[jiangZi[5]], '劫煞', '子年巳宫应为劫煞');
const jiangYin = jiangQianShenByBranch(2); // 寅年，将星在午
assert.equal(JIANG_QIAN_SHEN[jiangYin[6]], '将星', '寅年午宫应为将星');
assert.equal(JIANG_QIAN_SHEN[jiangYin[11]], '劫煞', '寅年亥宫应为劫煞');

// ── 单元：博士十二神，从生年禄存起，阳男阴女顺、阴男阳女逆 ──
const boshiJiaMale = boshiShenByStem(0, 'male'); // 甲年阳男，禄存在寅，顺行
assert.equal(BOSHI_SHEN[boshiJiaMale[2]], '博士', '甲年阳男寅宫应为博士');
assert.equal(BOSHI_SHEN[boshiJiaMale[3]], '力士', '甲年阳男卯宫应为力士');
assert.equal(BOSHI_SHEN[boshiJiaMale[11]], '大耗', '甲年阳男亥宫应为大耗（博士顺数第10）');
const boshiJiaFemale = boshiShenByStem(0, 'female'); // 甲年阳女，逆行
assert.equal(BOSHI_SHEN[boshiJiaFemale[2]], '博士', '甲年阳女寅宫应为博士');
assert.equal(BOSHI_SHEN[boshiJiaFemale[1]], '力士', '甲年阳女丑宫应为力士（逆行）');
const boshiYiMale = boshiShenByStem(1, 'male'); // 乙年阴男，禄存在卯，逆行
assert.equal(BOSHI_SHEN[boshiYiMale[3]], '博士', '乙年阴男卯宫应为博士');
assert.equal(BOSHI_SHEN[boshiYiMale[2]], '力士', '乙年阴男寅宫应为力士（逆行）');

// ── 端到端：generateChart 每宫都带十二神煞，且与本命口径一致 ──
// 1990-05-15 午时男：庚午年（年干庚=6，年支午=6），阳男。
const chart = generateChart({ year: 1990, month: 5, day: 15, hour: 6, gender: 'male', longitude: 120 });
assert.equal(chart.lunarInfo.yearBranch, 6, '1990 年应为午年');
assert.equal(chart.lunarInfo.yearStem, 6, '1990 年应为庚年');

const suiNames = new Set<string>();
const jiangNames = new Set<string>();
const boshiNames = new Set<string>();
for (const p of chart.palaces) {
  assert.ok(p.suiQianShen, `${BRANCHES[p.branch]}宫缺岁前十二神`);
  assert.ok(p.jiangQianShen, `${BRANCHES[p.branch]}宫缺将前十二神`);
  assert.ok(p.boshiShen, `${BRANCHES[p.branch]}宫缺博士十二神`);
  suiNames.add(p.suiQianShen!);
  jiangNames.add(p.jiangQianShen!);
  boshiNames.add(p.boshiShen!);
}
assert.equal(suiNames.size, 12, '岁前十二神在十二宫不得重复');
assert.equal(jiangNames.size, 12, '将前十二神在十二宫不得重复');
assert.equal(boshiNames.size, 12, '博士十二神在十二宫不得重复');

const palaceAt = (branch: number) => chart.palaces.find((p) => p.branch === branch)!;
assert.equal(palaceAt(6).suiQianShen, '岁建', '午年午宫应为岁建');
assert.equal(palaceAt(0).suiQianShen, '岁破', '午年子宫（对宫）应为岁破');
assert.equal(palaceAt(6).jiangQianShen, '将星', '午年（寅午戌）将星在午');
assert.equal(palaceAt(8).boshiShen, '博士', '庚年禄存在申，阳男申宫应为博士');
assert.equal(palaceAt(9).boshiShen, '力士', '庚年阳男顺行，酉宫应为力士');

// 阴女顺行端到端：1991-05-15 午时女：辛未年（年干辛=7，年支未=7），阴女顺行，禄存在酉。
const chartF = generateChart({ year: 1991, month: 5, day: 15, hour: 6, gender: 'female', longitude: 120 });
assert.equal(chartF.lunarInfo.yearStem, 7, '1991 年应为辛年');
const palaceAtF = (branch: number) => chartF.palaces.find((p) => p.branch === branch)!;
assert.equal(palaceAtF(9).boshiShen, '博士', '辛年禄存在酉，酉宫应为博士');
assert.equal(palaceAtF(10).boshiShen, '力士', '辛年阴女顺行，戌宫应为力士');
assert.equal(palaceAtF(7).suiQianShen, '岁建', '未年未宫应为岁建');

console.log('✓ 岁前/将前/博士十二神公式单元 + 排盘输出端到端回归通过');
