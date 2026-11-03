import type { Locale } from './config';

/**
 * Shared glossary for domain-specific terminology.
 * Keep canonical Chinese names so translations remain traceable to source material.
 */
export const terms = {
  ziwei: { vi: 'Tử Vi', en: 'Zi Wei', 'zh-CN': '紫微', zh: '紫微' },
  mingGong: { vi: 'Mệnh cung', en: 'Ming Palace', 'zh-CN': '命宫', zh: '命宫' },
  shenGong: { vi: 'Thân cung', en: 'Body Palace', 'zh-CN': '身宫', zh: '身宫' },
  siHua: { vi: 'Tứ Hóa', en: 'Four Transformations', 'zh-CN': '四化', zh: '四化' },
  huaLu: { vi: 'Hóa Lộc', en: 'Hua Lu', 'zh-CN': '化禄', zh: '化祿' },
  huaQuan: { vi: 'Hóa Quyền', en: 'Hua Quan', 'zh-CN': '化权', zh: '化權' },
  huaKe: { vi: 'Hóa Khoa', en: 'Hua Ke', 'zh-CN': '化科', zh: '化科' },
  huaJi: { vi: 'Hóa Kỵ', en: 'Hua Ji', 'zh-CN': '化忌', zh: '化忌' },
  daXian: { vi: 'Đại hạn', en: 'Decade cycle', 'zh-CN': '大限', zh: '大限' },
  liuNian: { vi: 'Lưu niên', en: 'Annual cycle', 'zh-CN': '流年', zh: '流年' },
  ziweiStar: { vi: 'Tử Vi', en: 'Emperor Star (Zi Wei)', 'zh-CN': '紫微星', zh: '紫微星' },
  tianjiStar: { vi: 'Thiên Cơ', en: '天機 (Tian Ji)', 'zh-CN': '天机星', zh: '天機星' },
  taiyangStar: { vi: 'Thái Dương', en: 'Sun (Tai Yang)', 'zh-CN': '太阳星', zh: '太陽星' },
  wuquStar: { vi: 'Vũ Khúc', en: 'Wu Qu', 'zh-CN': '武曲星', zh: '武曲星' },
  tiantongStar: { vi: 'Thiên Đồng', en: 'Tian Tong', 'zh-CN': '天同星', zh: '天同星' },
  lianzhenStar: { vi: 'Liêm Trinh', en: 'Lian Zhen', 'zh-CN': '廉贞星', zh: '廉貞星' },
} as const;

export type TermKey = keyof typeof terms;

export function term(key: TermKey, locale: Locale): string {
  return terms[key][locale];
}
