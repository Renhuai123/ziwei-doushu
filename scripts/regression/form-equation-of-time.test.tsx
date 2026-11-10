/** Web 表单必须计入均时差；固定样例沿用 true-solar-time.ts 的 NOAA 口径。 */
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BirthForm, { type BirthFormState } from '../../components/BirthForm';
import { formToBirthInfo, formToSearchParams, searchParamsToForm } from '../../lib/ziwei/share';

// 与 palace-minor-stars.test.tsx 一致，兼容 tsx 独立运行时的 classic JSX transform。
Object.assign(globalThis, { React });

function formAt(overrides: Partial<BirthFormState> = {}): BirthFormState {
  return {
    name: '', year: '2000', month: '11', day: '3',
    clockHour: '10', clockMinute: '50', unknownTime: false,
    province: '测试', city: '测试', longitude: 120, gender: 'male',
    ...overrides,
  };
}

const pick = (birth: ReturnType<typeof formToBirthInfo>) => ({
  year: birth.year, month: birth.month, day: birth.day, hour: birth.hour,
});
const render = (form: BirthFormState) => renderToStaticMarkup(
  React.createElement(BirthForm, { initialData: form, onSubmit: () => {} }),
);
const cases = [
  {
    label: '正均时差约 +16.36 分钟：10:50 → 11:06，巳时跨入午时',
    form: formAt(), expected: { year: 2000, month: 11, day: 3, hour: 6 }, branch: '午', correction: '+16',
  },
  {
    label: '负均时差约 -14.19 分钟：11:10 → 10:55，午时退回巳时',
    form: formAt({ month: '2', day: '11', clockHour: '11', clockMinute: '10' }),
    expected: { year: 2000, month: 2, day: 11, hour: 5 }, branch: '巳', correction: '-14',
  },
  {
    label: '正均时差跨入晚子时，应按现有 next-day 规则换日',
    form: formAt({ clockHour: '22' }),
    expected: { year: 2000, month: 11, day: 4, hour: 0 }, branch: '子', correction: '+16',
  },
  {
    label: '负均时差退回亥时，不能按钟表 23 点换日',
    form: formAt({ month: '2', day: '11', clockHour: '23', clockMinute: '10' }),
    expected: { year: 2000, month: 2, day: 11, hour: 11 }, branch: '亥', correction: '-14',
  },
  {
    label: '正均时差跨过午夜，只进位一天',
    form: formAt({ clockHour: '23' }),
    expected: { year: 2000, month: 11, day: 4, hour: 0 }, branch: '子', correction: '+16',
  },
  {
    label: '负均时差回到前日 23 点，晚子时规则抵消回退',
    form: formAt({ month: '2', day: '11', clockHour: '0', clockMinute: '10' }),
    expected: { year: 2000, month: 2, day: 11, hour: 0 }, branch: '子', correction: '-14',
  },
  {
    label: '经度修正 -80 分钟与均时差叠加：12:10 → 11:06',
    form: formAt({ longitude: 100, clockHour: '12', clockMinute: '10' }),
    expected: { year: 2000, month: 11, day: 3, hour: 6 }, branch: '午', correction: '-64',
  },
];

for (const { label, form, expected, branch, correction } of cases) {
  assert.deepEqual(pick(formToBirthInfo(form)), expected, label);
  const html = render(form);
  assert.ok(html.includes(`>${branch}时<`), `表单预览应与提交一致：${label}`);
  assert.ok(html.includes(`总时差 ${correction} 分钟`), `显示总修正量：${label}`);
  const restored = searchParamsToForm(formToSearchParams(form));
  assert.ok(restored);
  assert.deepEqual(formToBirthInfo({ ...formAt(), ...restored }), formToBirthInfo(form), `分享链接复现：${label}`);
}

// 同一钟表时间和经度，仅改变日期也会改变均时差与时辰。
const winter = formAt({ month: '2', day: '11' });
assert.equal(formToBirthInfo(winter).hour, 5);
assert.ok(render(winter).includes('>巳时<'));
assert.ok(render(formAt()).includes('>午时<'));

const control = formAt({ clockMinute: '20' });
assert.equal(formToBirthInfo(control).hour, 5, '远离边界的样例仍为巳时');

const noLocation = formAt({ province: '', city: '' });
assert.equal(formToBirthInfo(noLocation).hour, 5, '未填出生地不应用均时差');
assert.equal(formToBirthInfo(noLocation).longitude, undefined);
assert.ok(render(noLocation).includes('>巳时<'));

const unknown = formAt({ clockHour: '22', unknownTime: true });
assert.deepEqual(pick(formToBirthInfo(unknown)), { year: 2000, month: 11, day: 3, hour: 0 }, '时辰不详保持原日期与子时');
assert.ok(render(unknown).includes('>子时<'));

const incomplete = formAt({ year: '', month: '', day: '', longitude: 100, clockHour: '12', clockMinute: '10' });
assert.deepEqual(pick(formToBirthInfo(incomplete)), { year: 0, month: 0, day: 0, hour: 5 }, '未填日期时沿用经度修正，不生成无效日期');
assert.ok(!render(incomplete).includes('NaN'), '未填日期的预览不应出现 NaN');

console.log('Web form equation-of-time regression passed: preview, submission, rollover and sharing');
