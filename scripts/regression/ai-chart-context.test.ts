import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { BRANCHES, STEMS } from '../../lib/ziwei/constants';
import type { ZiweiChart } from '../../lib/ziwei/types';
import { stubServerOnly } from './ai-test-kit';

async function main() {
  stubServerOnly();
  const { describeChart, palaceLabel } = await import('../../lib/ai/chart-context');
  const { hemingKnowledge, hemingSystemPrompt, interpretSystemPrompt } = await import('../../lib/ai/prompts');

  const chart = generateChart({ year: 1990, month: 6, day: 15, hour: 3, gender: 'male' });
  const text = describeChart(chart);
  const lineFor = (name: string) => text.split('\n').find((l) => l.startsWith(`- ${name}（`));

  const ming = chart.palaces.find((p) => p.isMingGong)!;
  const mingLine = lineFor('命宫');
  assert.ok(mingLine, 'a line for the 命宫');
  assert.ok(mingLine.includes(`${STEMS[ming.stem]}${BRANCHES[ming.branch]}`), '命宫 stem-branch');
  const mingMajors = ming.stars.filter((s) => s.type === 'major');
  for (const star of mingMajors) assert.ok(mingLine.includes(star.name), `命宫 star ${star.name}`);
  if (mingMajors.length === 0) assert.ok(mingLine.includes('空宫，借对宫'));

  assert.ok(text.includes(`五行局：${chart.wuxingJuName}`), '五行局');
  assert.ok(text.includes(`命主：${chart.mingZhu}`) && text.includes(`身主：${chart.shenZhu}`), '命主/身主');
  assert.ok(text.includes('公历：1990年6月15日 卯时'), 'birth date with 时辰');
  assert.match(text, /农历：1990年\S+月\S+，生年干支庚午/);
  assert.match(text, /四柱（节气）：\S+ \S+ \S+ \S+/);

  assert.equal(text.split('\n').filter((l) => /^- \S+宫（[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/.test(l) && l.includes('三方四正')).length, 12, 'all 12 palaces');
  assert.ok(text.includes('生年四化（庚年生人）：化禄：太阳在'), '庚 year 四化: 太阳 化禄 first');
  for (const siHua of ['禄', '权', '科', '忌']) assert.ok(text.includes(`化${siHua}：`), `生年四化 ${siHua}`);

  const current = chart.daXians[chart.currentDaXianIndex];
  const currentLine = text.split('\n').find((l) => l.includes('当前大限'));
  assert.ok(current && currentLine, 'a current 大限');
  assert.ok(currentLine.includes(`${current.startAge}-${current.endAge}岁：${palaceLabel(current.palaceName)}`), 'current 大限 line');
  assert.equal(text.split('\n').filter((l) => /^- \d+-\d+岁：/.test(l)).length, chart.daXians.length, 'every 大限 listed');
  assert.ok(text.includes(`当前虚岁：${chart.currentAge}（约${1990 + chart.currentAge - 1}年）`));

  assert.match(text, /【程序识别的格局/);

  let withEmpty: ZiweiChart | undefined;
  for (let d = 1; d <= 28 && !withEmpty; d++) {
    const c = generateChart({ year: 1991, month: 3, day: d, hour: d % 12, gender: 'female' });
    if (c.palaces.some((p) => p.isEmpty)) withEmpty = c;
  }
  assert.ok(withEmpty, 'found a chart with an empty palace');
  const empty = withEmpty.palaces.find((p) => p.isEmpty)!;
  const emptyLine = describeChart(withEmpty).split('\n').find((l) => l.startsWith(`- ${palaceLabel(empty.name)}（`))!;
  assert.ok(emptyLine.includes(`空宫，借对宫${palaceLabel(empty.borrowedFromName!)}主星 ${empty.borrowedStars!.join('、')}`), 'empty palace shows the borrowed stars');

  const system = interpretSystemPrompt(text);
  assert.ok(system.endsWith(text), 'chart text is embedded');
  assert.match(system, /不要编造倪海厦/);

  const other = generateChart({ year: 1992, month: 9, day: 3, hour: 10, gender: 'female' });
  const knowledge = hemingKnowledge(chart, other);
  const fuqi = (c: ZiweiChart) => c.palaces.find((p) => p.name.startsWith('夫妻'))!;
  for (const [label, c] of [['甲方', chart], ['乙方', other]] as const) {
    const star = (fuqi(c).isEmpty ? fuqi(c).borrowedStars! : fuqi(c).stars.filter((s) => s.type === 'major').map((s) => s.name))[0];
    assert.ok(knowledge.includes(`${label}夫妻宫`) && knowledge.includes(`有${star}：`), `${label} 夫妻宫 entry for ${star}`);
  }
  assert.ok(knowledge.includes('双宫联参原则'), 'methodology included');
  assert.ok(knowledge.length < 9000, 'not the whole knowledge file');
  const hemingPrompt = hemingSystemPrompt('TEXT-A', 'TEXT-B', 'KNOWLEDGE');
  assert.ok(['TEXT-A', 'TEXT-B', 'KNOWLEDGE'].every((s) => hemingPrompt.includes(s)));

  console.log('AI chart context and prompts passed');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
