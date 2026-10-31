import { Solar } from 'lunar-javascript';

export const LIUREN_PALACES = [
  { name: '大安', fortune: '吉', meaning: '事情较为平稳，适合稳住节奏，循序推进。' },
  { name: '留连', fortune: '不利', meaning: '进展可能拖延或反复，耐心核实细节，别急于求成。' },
  { name: '速喜', fortune: '吉', meaning: '可能很快有好消息，时机合适时不妨及时行动。' },
  { name: '赤口', fortune: '凶', meaning: '容易出现口舌分歧，说话留有余地，避免争执。' },
  { name: '小吉', fortune: '吉', meaning: '眼前有小的顺遂，耐心经营，事情或会渐渐好转。' },
  { name: '空亡', fortune: '凶', meaning: '所盼之事可能暂时落空，不必强求，可先调整方向。' },
] as const;

export const LIUREN_HOURS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** 农历月日从一开始数，时辰用子起零的索引。 */
export function countLiurenSteps(month: number, day: number, hourBranch: number) {
  const monthPalace = (month - 1) % 6;
  const dayPalace = (monthPalace + day - 1) % 6;
  const hourPalace = (dayPalace + hourBranch) % 6;
  return { monthPalace, dayPalace, hourPalace };
}

/** 使用设备本地日期；23 点仍取当日农历日。 */
export function calculateLiuren(date: Date) {
  // lunar-javascript 在运行时提供 fromDate，但项目自带声明尚未包含该方法。
  const solar = Solar as typeof Solar & { fromDate(value: Date): ReturnType<typeof Solar.fromYmd> };
  const lunar = solar.fromDate(date).getLunar();
  const rawMonth = Number(lunar.getMonth());
  const lunarMonth = Math.abs(rawMonth);
  const lunarDay = Number(lunar.getDay());
  const hourBranch = Math.floor(((date.getHours() + 1) % 24) / 2);
  const steps = countLiurenSteps(lunarMonth, lunarDay, hourBranch);
  return {
    lunarMonth,
    lunarDay,
    isLeapMonth: rawMonth < 0,
    hourBranch,
    ...steps,
    result: LIUREN_PALACES[steps.hourPalace],
  };
}
