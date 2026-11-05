import type { Palace, ZiweiChart } from './types';

export type YunxianView = 'mingpan' | 'daxian' | 'liunian' | 'xiaoxian' | 'liuyue' | 'liuri' | 'liushi';

/** Giá trị lính canh (sentinel) chuyên dùng cho việc chọn Đồng Hạn độc lập; -1 dành riêng cho "không thuộc Đại Hạn thực tế nào". */
export const CHILDHOOD_DAXIAN_INDEX = -2;

// Tiểu Hạn giống như Lưu Niên đều căn cứ theo Lưu Niên được chọn (tuổi mụ / hư tuế) để xác định Đại Hạn trực thuộc, nên cùng xếp vào FLOW_VIEWS.
const FLOW_VIEWS = new Set<YunxianView>(['liunian', 'xiaoxian', 'liuyue', 'liuri', 'liushi']);

function isValidDaXianIndex(chart: ZiweiChart, index: number | null | undefined): index is number {
  return typeof index === 'number'
    && Number.isInteger(index)
    && index >= 0
    && index < chart.daXians.length;
}

/** Tra cứu Đại Hạn trực thuộc theo tuổi mụ (hư tuế). Khoảng tuổi Đại Hạn được xử lý bao gồm cả hai đầu mút (startAge và endAge). */
export function getDaXianIndexForAge(chart: ZiweiChart, age: number): number {
  if (!Number.isFinite(age)) return -1;
  const safeAge = Math.trunc(age);
  return chart.daXians.findIndex(dx => safeAge >= dx.startAge && safeAge <= dx.endAge);
}

/** Đổi năm Lưu Niên Âm lịch sang tuổi mụ rồi tra cứu Đại Hạn trực thuộc. */
export function getDaXianIndexForYear(chart: ZiweiChart, year: number): number {
  if (!Number.isFinite(year)) return -1;
  // liunianYear trên giao diện là năm Lưu Niên Âm lịch. Người sinh trước Tết Nguyên Đán thì năm sinh Âm lịch có thể nhỏ hơn năm Dương lịch 1 số,
  // tuổi mụ bắt buộc phải tính theo độ chênh năm Âm lịch, nếu không toàn bộ mốc ranh giới Đại Hạn sẽ bị chậm một năm.
  return getDaXianIndexForAge(chart, Math.trunc(year) - chart.lunarInfo.lunarYear + 1);
}

/** Quy đổi tuổi mụ khởi đầu của Đại Hạn sang năm Lưu Niên Âm lịch tương ứng. */
export function getDaXianStartYear(chart: ZiweiChart, index: number): number | null {
  if (!isValidDaXianIndex(chart, index)) return null;
  return chart.lunarInfo.lunarYear + chart.daXians[index].startAge - 1;
}

/** Trả về danh sách đầy đủ các năm Lưu Niên Dương lịch tương ứng của Đại Hạn đó; một Đại Hạn thông thường kéo dài đúng 10 năm. */
export function getDaXianYears(chart: ZiweiChart, index: number): number[] {
  if (!isValidDaXianIndex(chart, index)) return [];
  const dx = chart.daXians[index];
  const startYear = getDaXianStartYear(chart, index);
  if (startYear === null) return [];
  return Array.from({ length: dx.endAge - dx.startAge + 1 }, (_, offset) => startYear + offset);
}

/** Chuẩn lập lá số dòng chính xem giai đoạn tuổi mụ từ 1 đến (khởi hạn - 1) trước Đại Hạn thực tế đầu tiên là giai đoạn Đồng Hạn độc lập. */
export function getChildhoodYears(chart: ZiweiChart): number[] {
  const firstStartAge = chart.daXians[0]?.startAge;
  if (!Number.isFinite(firstStartAge) || firstStartAge <= 1) return [];
  return Array.from({ length: firstStartAge - 1 }, (_, offset) => chart.lunarInfo.lunarYear + offset);
}

export function isChildhoodYear(chart: ZiweiChart, year: number): boolean {
  const age = Math.trunc(year) - chart.lunarInfo.lunarYear + 1;
  const firstStartAge = chart.daXians[0]?.startAge;
  return Number.isFinite(firstStartAge) && age >= 1 && age < firstStartAge;
}

/**
 * Độ lệch Địa chi của Đại Mệnh Đồng Hạn so với cung Mệnh Bản Mệnh (tuổi mụ 1–5).
 * Cùng hệ thống với "Đại Mệnh" dưới đáy cung từng năm trên 4 lá số chuẩn vàng: tuổi mụ 1 = cung Mệnh Bản Mệnh, sau đó là −4/−1/+3/+4.
 * Dương Nam: Hợi → Mùi → Ngọ → Dậu; Âm Nam: Hợi → Mùi; Dương Nữ: Hợi → Mùi → Ngọ → Dậu → Sửu; Âm Nữ lập xuân: Mùi → Mão → Dần → Tỵ → Dậu.
 */
const CHILDHOOD_MING_OFFSET: Record<number, number> = {
  1: 0,
  2: -4,
  3: -5,
  4: -2,
  5: 2,
};

/**
 * Cung Bản Mệnh nơi an Đại Mệnh Đồng Hạn (dùng để lấy can cung, rồi đưa vào getSiHuaByStem / Đại Xương Đại Khúc).
 * Có năm Lưu Niên Âm lịch và tuổi mụ 1–5: an cung theo CHILDHOOD_MING_OFFSET.
 * Không có năm hoặc năm ngoài bảng: Âm Nữ lùi cung Mệnh −2 (giữ giá trị đã khóa 2026=Tỵ), các trường hợp còn lại lấy cung Mệnh Bản Mệnh.
 */
export function getChildhoodDaXianPalace(chart: ZiweiChart, year?: number): Palace | null {
  if (getChildhoodYears(chart).length === 0) return null;
  if (year != null) {
    const age = Math.trunc(year) - chart.lunarInfo.lunarYear + 1;
    if (age in CHILDHOOD_MING_OFFSET) {
      const branch = ((chart.mingGongBranch + CHILDHOOD_MING_OFFSET[age]) % 12 + 12) % 12;
      return chart.palaces.find((p) => p.branch === branch) ?? null;
    }
  }
  const yinFemale = chart.yinYangGender === '阴女'
    || (chart.birthInfo.gender === 'female' && chart.lunarInfo.yearStem % 2 === 1);
  const branch = yinFemale
    ? ((chart.mingGongBranch - 2) % 12 + 12) % 12
    : chart.mingGongBranch;
  return chart.palaces.find((p) => p.branch === branch) ?? null;
}

/**
 * Nguồn Đại Hạn dùng chung cho tất cả giao diện Vận Hạn:
 * - Chế độ xem Đại Hạn sử dụng Đại Hạn do người dùng bấm chọn;
 * - Lưu Niên, Lưu Nguyệt, Lưu Nhật, Lưu Thời sử dụng Đại Hạn thực tế thuộc về năm Lưu Niên được chọn;
 * - Trạng thái Bản Mệnh hoặc dữ liệu nhập bất thường sẽ quay về Đại Hạn hiện tại trên thực tế.
 */
export function resolveEffectiveDaXianIndex(
  chart: ZiweiChart,
  view: YunxianView,
  liunianYear: number,
  selectedDaXianIndex?: number | null,
): number {
  if (view === 'daxian' && isValidDaXianIndex(chart, selectedDaXianIndex)) {
    return selectedDaXianIndex;
  }
  if (view === 'daxian' && selectedDaXianIndex === CHILDHOOD_DAXIAN_INDEX && getChildhoodYears(chart).length > 0) {
    return CHILDHOOD_DAXIAN_INDEX;
  }

  if (FLOW_VIEWS.has(view)) {
    const yearIndex = getDaXianIndexForYear(chart, liunianYear);
    // -1 biểu thị Đồng Hạn hoặc vượt ngoài phạm vi Đại Hạn đã khởi tạo; không được quay về nhầm Đại Hạn hiện tại thực tế.
    return isValidDaXianIndex(chart, yearIndex) ? yearIndex : -1;
  }

  if (isValidDaXianIndex(chart, chart.currentDaXianIndex)) return chart.currentDaXianIndex;
  // Khi thực sự ở Đồng Hạn thì currentDaXianIndex = -1; không thể chỉ vì muốn có giá trị mà áp nhầm vào Đại Hạn thực tế đầu tiên.
  return -1;
}
