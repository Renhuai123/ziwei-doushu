import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';

const expected = [
  ['命宫', '将军', '灾煞', '岁破'], ['父母', '奏书', '天煞', '龙德'],
  ['福德', '飞廉', '指背', '白虎'], ['田宅', '喜神', '咸池', '天德'],
  ['官禄', '病符', '月煞', '吊客'], ['仆役', '大耗', '亡神', '病符'],
  ['迁移', '伏兵', '将星', '岁建'], ['疾厄', '官符', '攀鞍', '晦气'],
  ['财帛', '博士', '岁驿', '丧门'], ['子女', '力士', '息神', '贯索'],
  ['夫妻', '青龙', '华盖', '官符'], ['兄弟', '小耗', '劫煞', '小耗'],
];
const chart = generateChart({ year: 1990, month: 6, day: 15, hour: 6, gender: 'male' });
for (let branch = 0; branch < 12; branch++) {
  const palace = chart.palaces.find(p => p.branch === branch);
  assert.ok(palace, `missing branch ${branch}`);
  assert.deepEqual([palace.name, palace.boshi12, palace.jiangqian12, palace.suiqian12], expected[branch], `branch ${branch}`);
}
for (const birth of [
  { year: 1990, month: 6, day: 15, hour: 6, gender: 'male' as const },
  { year: 1984, month: 2, day: 4, hour: 0, gender: 'female' as const },
  { year: 2000, month: 12, day: 31, hour: 11, gender: 'male' as const },
  { year: 2024, month: 5, day: 10, hour: 3, gender: 'female' as const },
]) {
  const palaces = generateChart(birth).palaces;
  assert.equal(palaces.length, 12);
  for (const p of palaces) {
    for (const name of [p.boshi12, p.jiangqian12, p.suiqian12]) assert.ok(name?.trim());
  }
  assert.equal(new Set(palaces.map(p => p.boshi12)).size, 12);
}
console.log('twelve gods regression: passed');
