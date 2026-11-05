/**
 * Module tiện ích Tứ Hóa — Can năm / Can cung Đại hạn / Can Lưu niên / Can Lưu nguyệt / Can Lưu nhật / Can Lưu thời
 *                         + Phát hiện Tự Hóa theo can cung + Truy nguyên Cung Lai Nhân
 *
 * Chuẩn lập lá số (Quy tắc sắt 2026-07-21: lập lá số lấy lá số chuẩn vàng làm căn cứ):
 *   Tứ Hóa Bản Mệnh = Tứ Hóa theo Thiên can năm sinh (ấn son đỏ trên lá số, luôn luôn hiển thị)
 *   Tứ Hóa Vận Hạn = Can cung Đại hạn / Can Lưu niên / Can Lưu nguyệt / Can Lưu nhật / Can Lưu thời → các con dấu màu xếp tầng
 * Thân bài luận đoán vẫn theo chuẩn Thầy Nghê; module này phục vụ cho việc xếp tầng hiển thị trên lá số.
 */

import { Lunar } from 'lunar-javascript';
import type { ZiweiChart, Palace, SiHua } from './types';
import { SI_HUA_TABLE, STEMS } from './constants';
import { CHILDHOOD_DAXIAN_INDEX, getChildhoodDaXianPalace } from './yunxian-context';

// ─── 1) Lấy bốn sao Tứ Hóa từ chỉ số Thiên can ───────────────────────────────────
/** Chỉ số Thiên can 0-9 → tên sao tương ứng với { 禄: Lộc, 权: Quyền, 科: Khoa, 忌: Kỵ } */
export function getSiHuaByStem(stemIndex: number): Record<SiHua, string> {
  const arr = SI_HUA_TABLE[stemIndex];
  if (!arr) return { 禄: '', 权: '', 科: '', 忌: '' };
  return { 禄: arr[0], 权: arr[1], 科: arr[2], 忌: arr[3] };
}

/** Tên sao → Loại Tứ Hóa (được xác định bởi một Thiên can cụ thể) */
export function buildStarSiHuaMap(stemIndex: number): Record<string, SiHua> {
  const arr = SI_HUA_TABLE[stemIndex];
  if (!arr) return {};
  return { [arr[0]]: '禄', [arr[1]]: '权', [arr[2]]: '科', [arr[3]]: '忌' };
}

// ─── 2) Năm Dương lịch → Chỉ số Thiên can của trụ năm ──────────────────────────────────
/** Năm Dương lịch → Chỉ số Thiên can của trụ năm (0=Giáp, ... 9=Quý) */
export function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

/** Năm Dương lịch → Chỉ số Địa chi của trụ năm (0=Tý, ... 11=Hợi) */
export function getYearBranchIndex(year: number): number {
  return ((year - 4) % 12 + 12) % 12;
}

// ─── 3) Tứ Hóa Đại hạn: Lấy can cung của cung Đại hạn (không phải can năm Bản Mệnh) ───────────────
/**
 * Tứ Hóa theo can cung Đại hạn
 * @param chart Lá số Mệnh bàn
 * @param dxIndex Chỉ số Đại hạn (chart.daXians[dxIndex]); Đồng hạn truyền vào CHILDHOOD_DAXIAN_INDEX
 * @returns Bốn sao Tứ Hóa của Đại hạn này
 */
export function getDaXianSiHua(
  chart: ZiweiChart,
  dxIndex: number,
  year?: number,
): { stemIndex: number; stemName: string; transforms: Record<SiHua, string> } | null {
  const dxPalace = dxIndex === CHILDHOOD_DAXIAN_INDEX
    ? getChildhoodDaXianPalace(chart, year)
    : (() => {
        const dx = chart.daXians[dxIndex];
        if (!dx) return null;
        return chart.palaces.find(p => p.branch === dx.palaceBranch) ?? null;
      })();
  if (!dxPalace) return null;
  const stemIndex = dxPalace.stem;
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 4) Tứ Hóa Lưu niên ──────────────────────────────────────────────
export function getLiuNianSiHua(year: number): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
} {
  const stemIndex = getYearStemIndex(year);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 5) Tứ Hóa Lưu nguyệt (Thiên can trụ tháng, suy ra từ can năm + thứ tự tháng) ───────────────
/**
 * Thiên can Lưu nguyệt (Ngũ Hổ Độn: năm Giáp Kỷ khởi Bính Dần, năm Ất Canh khởi Mậu Dần, năm Bính Tân khởi Canh Dần, năm Đinh Nhâm khởi Nhâm Dần, năm Mậu Quý khởi Giáp Dần)
 * month: Tháng Âm lịch 1-12
 */
export function getLiuYueStemIndex(yearStem: number, month: number): number {
  // Ngũ Hổ Độn: Thiên can tháng Giêng (tháng Dần)
  const startStemOfYin: Record<number, number> = {
    0: 2, 5: 2,  // Giáp Kỷ → Bính
    1: 4, 6: 4,  // Ất Canh → Mậu
    2: 6, 7: 6,  // Bính Tân → Canh
    3: 8, 8: 8,  // Đinh Nhâm → Nhâm
    4: 0, 9: 0,  // Mậu Quý → Giáp
  };
  const yinStem = startStemOfYin[yearStem] ?? 0;
  // Từ Dần (tháng Giêng) đến tháng mục tiêu (month nhận giá trị 1-12)
  return (yinStem + ((month - 1) % 12) + 10) % 10;
}

export interface LiuYueSiHuaOptions {
  /** Lưu nguyệt của tháng nhuận căn cứ nửa đầu/nửa sau của ngày Âm lịch thực tế để lấy chuẩn tháng này/tháng sau. */
  isLeapMonth?: boolean;
  liuriDay?: number;
  /** Can năm sử dụng khi nửa sau tháng 12 nhuận chuyển tiếp sang tháng Giêng năm sau. */
  nextYearStem?: number;
}

export function getEffectiveLiuYueMonth(month: number, options: LiuYueSiHuaOptions = {}): number {
  const normalizedMonth = Math.max(1, Math.min(12, Math.trunc(month)));
  if (!options.isLeapMonth || (options.liuriDay ?? 1) <= 15) return normalizedMonth;
  return normalizedMonth >= 12 ? 1 : normalizedMonth + 1;
}

export function getLiuYueSiHua(yearStem: number, month: number, options: LiuYueSiHuaOptions = {}): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
  month: number;
} {
  const effectiveMonth = getEffectiveLiuYueMonth(month, options);
  const sourceYearStem = options.isLeapMonth
    && effectiveMonth === 1
    && (options.liuriDay ?? 1) > 15
    ? (options.nextYearStem ?? yearStem)
    : yearStem;
  const stemIndex = getLiuYueStemIndex(sourceYearStem, effectiveMonth);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
    month: effectiveMonth,
  };
}

// ─── 5b) Tứ Hóa Lưu nhật (Thiên can trụ ngày Âm lịch) ──────────────────────────────
/**
 * Tứ Hóa Thiên can Lưu nhật: Dùng năm tháng ngày Âm lịch để lấy can trụ ngày (chuẩn thông dụng "hiển thị Tứ Hóa can ngày").
 * Tháng nhuận truyền isLeapMonth=true (lunar-javascript biểu thị tháng nhuận bằng số âm).
 */
export function getLiuRiSiHua(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth = false,
): { stemIndex: number; stemName: string; transforms: Record<SiHua, string> } | null {
  try {
    const monthKey = isLeapMonth ? -Math.abs(lunarMonth) : Math.abs(lunarMonth);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lunar = (Lunar as any).fromYmd(lunarYear, monthKey, lunarDay) as { getDayGan(): string };
    const stemIndex = STEMS.indexOf(lunar.getDayGan());
    if (stemIndex < 0) return null;
    return {
      stemIndex,
      stemName: STEMS[stemIndex] ?? '',
      transforms: getSiHuaByStem(stemIndex),
    };
  } catch {
    return null;
  }
}

// ─── 5c) Tứ Hóa Lưu thời (Ngũ Thử Độn: can ngày khởi Thiên can giờ Tý) ───────────────────
/** Chi giờ: 0=Tý... 11=Hợi; từ can ngày suy ra can giờ rồi lấy Tứ Hóa */
export function getLiuShiSiHua(dayStemIndex: number, hourBranch: number): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
} {
  // Giáp Kỷ → Giáp Tý, Ất Canh → Bính Tý, Bính Tân → Mậu Tý, Đinh Nhâm → Canh Tý, Mậu Quý → Nhâm Tý
  const ziStemByDayStem: Record<number, number> = {
    0: 0, 5: 0,
    1: 2, 6: 2,
    2: 4, 7: 4,
    3: 6, 8: 6,
    4: 8, 9: 8,
  };
  const branch = ((Math.trunc(hourBranch) % 12) + 12) % 12;
  const stemIndex = ((ziStemByDayStem[dayStemIndex] ?? 0) + branch) % 10;
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 6) Phát hiện Tự Hóa theo can cung ──────────────────────────────────────────
/**
 * Tự Hóa: Tứ Hóa do can cung của chính cung đó khởi ra, mà sao được hóa lại đóng đúng tại bản cung.
 * Ví dụ: Can cung là Giáp (Liêm Phá Vũ Dương), nếu chính tinh bản cung có "Liêm Trinh" thì cung đó có "Tự Hóa Lộc".
 */
export interface SelfSihua {
  siHua: SiHua;        // Lộc/Quyền/Khoa/Kỵ (禄/权/科/忌)
  starName: string;    // Sao được hóa
}

export function detectSelfSihua(palace: Palace): SelfSihua[] {
  const transforms = getSiHuaByStem(palace.stem);
  const found: SelfSihua[] = [];
  const palaceStarNames = new Set(palace.stars.map(s => s.name));
  (['禄', '权', '科', '忌'] as SiHua[]).forEach(sh => {
    const starName = transforms[sh];
    if (starName && palaceStarNames.has(starName)) {
      found.push({ siHua: sh, starName });
    }
  });
  return found;
}

// ─── 7) Truy nguyên Cung Lai Nhân ────────────────────────────────────────────
/**
 * Cung Lai Nhân: Đối với một sao và một hóa tinh nhất định, truy nguyên xem can cung của cung nào đã "phi" tới.
 *
 * Hệ thống của Thầy Nghê thường dùng: Cung Lai Nhân của Hóa Kỵ — Hóa Kỵ do "can cung" của cung nào khởi tác thì cung đó chính là cung nguồn cơn của vấn đề.
 *
 * @param chart Lá số Mệnh bàn
 * @param starName Tên sao được hóa (như "Thái Âm" / "太阴")
 * @param sihua  Loại Tứ Hóa (như "忌")
 * @returns Mảng các cung khởi phát hóa tinh này (thông thường chỉ có một, nhưng nếu nhiều cung có can cung trùng nhau thì có thể có nhiều)
 */
export function findIncomingPalaces(
  chart: ZiweiChart,
  starName: string,
  sihua: SiHua,
): Palace[] {
  const result: Palace[] = [];
  chart.palaces.forEach(p => {
    const transforms = getSiHuaByStem(p.stem);
    if (transforms[sihua] === starName) {
      result.push(p);
    }
  });
  return result;
}

/**
 * Tính toán hàng loạt danh sách Tự Hóa cho tất cả các cung trên lá số
 */
export function buildAllSelfSihua(chart: ZiweiChart): Record<number, SelfSihua[]> {
  const result: Record<number, SelfSihua[]> = {};
  chart.palaces.forEach(p => {
    const list = detectSelfSihua(p);
    if (list.length > 0) result[p.branch] = list;
  });
  return result;
}

// ─── 8) Xếp tầng tổng hợp (overlay): Hiệu ứng xếp chồng nhiều tầng Tứ Hóa ──────────
/**
 * Tạo góc nhìn tổng hợp: tên sao → Tứ Hóa nhiều tầng
 * Dùng để hiển thị đồng thời trên cung vị: Hóa Bản Mệnh / Hóa Đại Hạn / Hóa Lưu Niên
 * Mức độ ưu tiên: Bản Mệnh < Đại Hạn < Lưu Niên (tất cả đều được đánh dấu hiển thị)
 */
export interface SiHuaOverlay {
  native?: SiHua;    // Bản Mệnh (can năm)
  daXian?: SiHua;    // Đại Hạn
  liuNian?: SiHua;   // Lưu Niên
  liuYue?: SiHua;    // Lưu Nguyệt
}

export function buildOverlayForStar(
  starName: string,
  nativeMap: Record<string, SiHua>,
  daXianMap?: Record<string, SiHua>,
  liuNianMap?: Record<string, SiHua>,
  liuYueMap?: Record<string, SiHua>,
): SiHuaOverlay {
  return {
    native: nativeMap[starName],
    daXian: daXianMap?.[starName],
    liuNian: liuNianMap?.[starName],
    liuYue: liuYueMap?.[starName],
  };
}
