import { Solar } from 'lunar-javascript';
import { createNatalAstrolabe, generateChart, type LunarMonthPolicy } from './algorithm';
import { BRANCHES, STEMS } from './constants';
import { getSiHuaByStem } from './sihua';
import { getChildhoodDaXianPalace, isChildhoodYear } from './yunxian-context';
import type { BirthInfo, SiHua, ZiweiChart } from './types';

export interface HoroscopeLayer {
  mingBranch: number;
  palaceNames: string[];
  stem: number;
  ganzhiBranch: number;
  siHua: Record<SiHua, string>;
}

export interface Horoscope {
  daxian: HoroscopeLayer;
  xiaoxian: HoroscopeLayer & { nominalAge: number };
  liunian: HoroscopeLayer;
  liuyue: HoroscopeLayer;
  liuri: HoroscopeLayer;
  liushi: HoroscopeLayer;
}

interface IztroLayer {
  index: number;
  heavenlyStem: string;
  earthlyBranch: string;
  palaceNames: string[];
}

function convertLayer(layer: IztroLayer): HoroscopeLayer {
  const stem = STEMS.indexOf(layer.heavenlyStem);
  return {
    mingBranch: (layer.index + 2) % 12,
    palaceNames: Array.from({ length: 12 }, (_, branch) => layer.palaceNames[(branch + 10) % 12]),
    stem,
    ganzhiBranch: BRANCHES.indexOf(layer.earthlyBranch),
    siHua: getSiHuaByStem(stem),
  };
}

/** 目标日期为公历，hour 为子起 0–11 的时辰索引。 */
export function getHoroscope(birth: BirthInfo, target: { year: number; month: number; day: number; hour: number }, chart?: ZiweiChart): Horoscope {
  const policy = (birth as BirthInfo & { leapMonthPolicy?: LunarMonthPolicy }).leapMonthPolicy;
  const natal = createNatalAstrolabe(birth, policy);
  const raw = natal.horoscope(`${target.year}-${target.month}-${target.day}`, target.hour);
  const result: Horoscope = {
    daxian: convertLayer(raw.decadal),
    xiaoxian: { ...convertLayer(raw.age), nominalAge: raw.age.nominalAge },
    liunian: convertLayer(raw.yearly),
    liuyue: convertLayer(raw.monthly),
    liuri: convertLayer(raw.daily),
    liushi: convertLayer(raw.hourly),
  };
  const natalChart = chart ?? generateChart(birth, { leapMonth: policy });
  const lunarYear = Number(Solar.fromYmd(target.year, target.month, target.day).getLunar().getYear());
  if (isChildhoodYear(natalChart, lunarYear)) {
    const palace = getChildhoodDaXianPalace(natalChart, lunarYear);
    if (palace) {
      const names = ['命宫', '父母', '福德', '田宅', '官禄', '仆役', '迁移', '疾厄', '财帛', '子女', '夫妻', '兄弟'];
      result.daxian = {
        mingBranch: palace.branch,
        palaceNames: Array.from({ length: 12 }, (_, branch) => names[(branch - palace.branch + 12) % 12]),
        stem: palace.stem,
        ganzhiBranch: palace.branch,
        siHua: getSiHuaByStem(palace.stem),
      };
    }
  }
  return result;
}
