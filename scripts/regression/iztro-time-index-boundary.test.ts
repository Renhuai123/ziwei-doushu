import assert from 'node:assert/strict';
import { BRANCHES } from '../../lib/ziwei/constants';
import { generateChart } from '../../lib/ziwei/algorithm';
import { formToBirthInfo } from '../../lib/ziwei/share';
import type { BirthInfo } from '../../lib/ziwei/types';
import type { BirthFormState } from '../../components/BirthForm';

const EXPECTED_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const baseBirthInfo: BirthInfo = {
  year: 2000,
  month: 1,
  day: 31,
  hour: 0,
  gender: 'male',
};

assert.deepEqual(BRANCHES, EXPECTED_BRANCHES, 'the branch index order must remain canonical');

for (const [hour, branch] of EXPECTED_BRANCHES.entries()) {
  const chart = generateChart({ ...baseBirthInfo, hour });
  assert.equal(chart.birthInfo.hour, hour, `hour ${hour} should be retained`);
  assert.equal(BRANCHES[chart.birthInfo.hour], branch, `hour ${hour} should map to ${branch}`);
}

for (const hour of [-1, 12, 0.5]) {
  assert.throws(
    () => generateChart({ ...baseBirthInfo, hour }),
    RangeError,
    `hour ${hour} should be rejected before chart generation`,
  );
}

function formAt(clockHour: string): BirthFormState {
  return {
    name: '',
    year: '2000',
    month: '1',
    day: '31',
    clockHour,
    clockMinute: '30',
    unknownTime: false,
    province: '',
    city: '',
    longitude: 120,
    gender: 'male',
  };
}

const lateZi = formToBirthInfo(formAt('23'));
assert.deepEqual(
  { year: lateZi.year, month: lateZi.month, day: lateZi.day, hour: lateZi.hour },
  { year: 2000, month: 2, day: 1, hour: 0 },
  '23:30 is the next calendar date and branch index 0',
);

const earlyZi = formToBirthInfo(formAt('0'));
assert.deepEqual(
  { year: earlyZi.year, month: earlyZi.month, day: earlyZi.day, hour: earlyZi.hour },
  { year: 2000, month: 1, day: 31, hour: 0 },
  '00:30 stays on the same calendar date and branch index 0',
);

console.log('iztro hour-index boundary regression passed');
