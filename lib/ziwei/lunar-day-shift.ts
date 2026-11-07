/**
 * Dịch chuyển các sao phụ thuộc **ngày âm lịch** — dùng khi lịch âm Việt Nam và lịch âm Trung Quốc
 * không cùng một ngày.
 *
 * ── Vì sao phải làm việc này ─────────────────────────────────────────────
 * Engine an sao (iztro) lấy tháng/ngày âm từ lịch Trung Quốc (UTC+8). Lá số Việt Nam phải dùng
 * tháng/ngày âm Việt Nam (UTC+7), mà hai lịch lệch nhau 1 ngày ở ~4% số tháng, lệch cả tháng nhuận
 * ở một số năm (1984, 1985, 2033…), và có ~0,1% ngày âm Việt Nam (ngày 30 của tháng mà lịch Trung
 * Quốc chỉ có 29 ngày) **không tồn tại** trong lịch Trung Quốc để truyền vào engine.
 *
 * Cách làm: luôn an lá số nền theo **mùng 1** của đúng tháng âm Việt Nam (mùng 1 luôn tồn tại ở cả
 * hai lịch, nên tháng/năm/giờ đều đúng), rồi dịch các sao phụ thuộc ngày sang đúng ngày âm Việt Nam.
 *
 * ── Những sao phụ thuộc ngày âm (đúng theo iztro `star/location.js`) ────
 *   · 紫微系 6 sao quanh Tử Vi, 天府系 8 sao quanh Thiên Phủ (vị trí Tử Vi tính từ ngày âm + Cục);
 *   · 三台, 八座 (từ Tả Phù / Hữu Bật cộng/trừ ngày), 恩光, 天貴 (từ Văn Xương / Văn Khúc cộng ngày).
 * Không sao nào khác dùng ngày âm — tháng dùng Ngũ Hổ Độn/Tháng, năm dùng can chi năm, giờ dùng giờ.
 *
 * Chỉ số cung ở đây theo quy ước của iztro: **Dần = 0** … Sửu = 11 (không phải Tý = 0).
 */

import type { Palace, Star } from './types';
import { schoolStarBrightness } from './school-data';
import type { BrightnessSchool } from './school-data';
import type { StarBrightness } from './types';

/** iztro: cung bắt đầu từ Dần, nên cung 0 = địa chi Dần. */
const YIN_BRANCH_INDEX = 2;

const fixIndex = (index: number, max = 12) => ((index % max) + max) % max;

/** Chỉ số cung (Dần = 0) của một địa chi (Tý = 0). */
export function branchToPalaceIndex(branch: number): number {
  return fixIndex(branch - YIN_BRANCH_INDEX);
}

/** Địa chi (Tý = 0) của một chỉ số cung (Dần = 0). */
export function palaceIndexToBranch(index: number): number {
  return fixIndex(index + YIN_BRANCH_INDEX);
}

/**
 * Vị trí sao Tử Vi theo ngày âm + Cục (Ngũ hành cục 2–6), quy ước Dần = 0.
 * Thuật: tìm bội số nhỏ nhất của Cục ≥ ngày; thương số (mod 12) − 1 là vị trí xuất phát,
 * lẻ thì tiến, chẵn thì lùi số bước đã bù — giống `getStartIndex` của iztro.
 */
export function ziweiPalaceIndex(fiveElementsValue: number, lunarDay: number): number {
  if (!Number.isFinite(fiveElementsValue) || fiveElementsValue <= 0) return 0;
  const day = Math.min(Math.max(Math.trunc(lunarDay), 1), 30);
  let offset = 0;
  while ((day + offset) % fiveElementsValue !== 0) offset++;
  const quotient = Math.floor((day + offset) / fiveElementsValue) % 12;
  let index = quotient - 1;
  index = offset % 2 === 0 ? index + offset : index - offset;
  return fixIndex(index);
}

/** Thiên Phủ đối xứng với Tử Vi qua trục Dần–Thân. */
export function tianfuPalaceIndex(ziweiIndex: number): number {
  return fixIndex(12 - ziweiIndex);
}

/** Sao Tử Vi hệ: đặt tại `ziweiIndex − offset`. */
const ZIWEI_GROUP: ReadonlyArray<readonly [string, number]> = [
  ['紫微', 0], ['天机', 1], ['太阳', 3], ['武曲', 4], ['天同', 5], ['廉贞', 8],
];

/** Sao Thiên Phủ hệ: đặt tại `tianfuIndex + offset`. */
const TIANFU_GROUP: ReadonlyArray<readonly [string, number]> = [
  ['天府', 0], ['太阴', 1], ['贪狼', 2], ['巨门', 3], ['天相', 4], ['天梁', 5], ['七杀', 6], ['破军', 10],
];

/** Sao theo ngày: 三台/八座 lấy gốc Tả Phù/Hữu Bật, 恩光/天貴 lấy gốc Văn Xương/Văn Khúc. */
const DAY_STARS = ['三台', '八座', '恩光', '天贵'] as const;

function brightnessFor(
  name: string,
  branch: number,
  school?: BrightnessSchool,
): { brightness?: Star['brightness']; brightnessRaw?: StarBrightness } {
  const raw = schoolStarBrightness(name, branch, school);
  if (!raw) return {};
  const bright = raw === '庙' || raw === '旺' ? 'bright' : raw === '陷' || raw === '不' || raw === '闲' ? 'dim' : 'normal';
  const valid: StarBrightness[] = ['庙', '旺', '得', '利', '平', '不', '闲', '陷', '地'];
  const brightnessRaw = valid.find((v) => raw.includes(v));
  return { brightness: bright, brightnessRaw };
}

function takeStar(palaces: Palace[], name: string): Star | undefined {
  for (const palace of palaces) {
    const index = palace.stars.findIndex((s) => s.name === name);
    if (index >= 0) return palace.stars.splice(index, 1)[0];
  }
  return undefined;
}

function placeStar(palaces: Palace[], star: Star, targetBranch: number, school?: BrightnessSchool): void {
  const target = palaces.find((p) => p.branch === targetBranch);
  if (!target) return;
  const fresh = brightnessFor(star.name, targetBranch, school);
  target.stars.push({
    ...star,
    brightness: fresh.brightness ?? star.brightness,
    brightnessRaw: fresh.brightnessRaw ?? star.brightnessRaw,
  });
}

function starBranch(palaces: Palace[], name: string): number | null {
  for (const palace of palaces) {
    if (palace.stars.some((s) => s.name === name)) return palace.branch;
  }
  return null;
}

/** Vị trí (chỉ số cung, Dần = 0) của 4 sao theo ngày, tính từ gốc Tả/Hữu/Xương/Khúc. */
function dayStarPalaceIndexes(palaces: Palace[], lunarDay: number): Record<string, number> | null {
  const zuo = starBranch(palaces, '左辅');
  const you = starBranch(palaces, '右弼');
  const chang = starBranch(palaces, '文昌');
  const qu = starBranch(palaces, '文曲');
  if (zuo === null || you === null || chang === null || qu === null) return null;
  const d = Math.max(0, Math.trunc(lunarDay) - 1);
  return {
    三台: fixIndex(branchToPalaceIndex(zuo) + d),
    八座: fixIndex(branchToPalaceIndex(you) - d),
    恩光: fixIndex(((branchToPalaceIndex(chang) + d) % 12) - 1),
    天贵: fixIndex(((branchToPalaceIndex(qu) + d) % 12) - 1),
  };
}

/**
 * Dịch các sao phụ thuộc ngày âm: từ ngày `fromDay` (thường là mùng 1 của lá số nền) sang `toDay`.
 *
 * `fiveElementsValue` là Ngũ hành cục (2–6) của lá số; `school` chỉ dùng để tính lại độ sáng sau khi dời.
 * Hàm thuần tuý: sửa trực tiếp mảng `palaces` và trả lại chính mảng đó.
 */
export function relocateLunarDayStars(
  palaces: Palace[],
  fromDay: number,
  toDay: number,
  fiveElementsValue: number,
  school?: BrightnessSchool,
): Palace[] {
  if (fromDay === toDay) return palaces;

  // ── 14 chính tinh ──
  const newZiwei = ziweiPalaceIndex(fiveElementsValue, toDay);
  const newTianfu = tianfuPalaceIndex(newZiwei);

  for (const [name, offset] of ZIWEI_GROUP) {
    const star = takeStar(palaces, name);
    if (star) placeStar(palaces, star, palaceIndexToBranch(fixIndex(newZiwei - offset)), school);
  }
  for (const [name, offset] of TIANFU_GROUP) {
    const star = takeStar(palaces, name);
    if (star) placeStar(palaces, star, palaceIndexToBranch(fixIndex(newTianfu + offset)), school);
  }

  // ── 4 sao theo ngày ──
  // Vị trí tính từ Tả Phù / Hữu Bật / Văn Xương / Văn Khúc — không phụ thuộc ngày, nên tính trước khi dời.
  const after = dayStarPalaceIndexes(palaces, toDay);
  if (!after) return palaces;
  for (const name of DAY_STARS) {
    const star = takeStar(palaces, name);
    if (star) placeStar(palaces, star, palaceIndexToBranch(after[name]), school);
  }

  return palaces;
}
