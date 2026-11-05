// Thiên Can (Heavenly Stems)
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// Địa Chi (Earthly Branches)
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Canh giờ (Thời Thần) tương ứng Địa Chi
export const SHICHEN = [
  { branch: 0, name: '子时', range: '23:00-01:00' },
  { branch: 1, name: '丑时', range: '01:00-03:00' },
  { branch: 2, name: '寅时', range: '03:00-05:00' },
  { branch: 3, name: '卯时', range: '05:00-07:00' },
  { branch: 4, name: '辰时', range: '07:00-09:00' },
  { branch: 5, name: '巳时', range: '09:00-11:00' },
  { branch: 6, name: '午时', range: '11:00-13:00' },
  { branch: 7, name: '未时', range: '13:00-15:00' },
  { branch: 8, name: '申时', range: '15:00-17:00' },
  { branch: 9, name: '酉时', range: '17:00-19:00' },
  { branch: 10, name: '戌时', range: '19:00-21:00' },
  { branch: 11, name: '亥时', range: '21:00-23:00' },
];

// Thứ tự tên 12 cung; chỉ số Địa chi từ cung Mệnh cứ mỗi lần giảm 1 là tiến tới một cung (trên giao diện lá số là ngược chiều kim đồng hồ)
export const PALACE_NAMES_ORDER = [
  '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
  '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
];

// Nạp Âm Ngũ Hành (Ngũ hành của 30 cặp can chi)
export const NAYIN_ELEMENTS = [
  '金','火','木','土','金','火','水','土','金','木',
  '水','土','火','木','水','金','火','木','土','金',
  '火','水','土','金','木','水','土','火','木','水'
];

// Ngũ Hành → Cục số
export const ELEMENT_TO_JU: Record<string, number> = {
  '水': 2, '木': 3, '金': 4, '土': 5, '火': 6
};

// Tên Cục số
export const JU_NAMES: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局'
};

// Bảng Tứ Hóa (Can năm → [Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ])
export const SI_HUA_TABLE: Record<number, [string, string, string, string]> = {
  0: ['廉贞', '破军', '武曲', '太阳'],   // Giáp (甲)
  1: ['天机', '天梁', '紫微', '太阴'],   // Ất (乙)
  2: ['天同', '天机', '文昌', '廉贞'],   // Bính (丙)
  3: ['太阴', '天同', '天机', '巨门'],   // Đinh (丁)
  4: ['贪狼', '太阴', '右弼', '天机'],   // Mậu (戊)
  5: ['武曲', '贪狼', '天梁', '文曲'],   // Kỷ (己)
  6: ['太阳', '武曲', '太阴', '天同'],   // Canh (庚)
  7: ['巨门', '太阳', '文曲', '文昌'],   // Tân (辛)
  8: ['天梁', '紫微', '左辅', '武曲'],   // Nhâm (壬)
  9: ['破军', '巨门', '太阴', '贪狼'],   // Quý (癸)
};

// Bảng Thiên Khôi Thiên Việt (Can năm → [chi Thiên Khôi, chi Thiên Việt])
export const TIANKUI_TABLE: Record<number, [number, number]> = {
  0: [1, 7],   // Giáp: Khôi Sửu, Việt Mùi
  1: [0, 8],   // Ất: Khôi Tý, Việt Thân
  2: [11, 9],  // Bính: Khôi Hợi, Việt Dậu
  3: [11, 9],  // Đinh: Khôi Hợi, Việt Dậu
  4: [1, 7],   // Mậu: Khôi Sửu, Việt Mùi
  5: [0, 8],   // Kỷ: Khôi Tý, Việt Thân
  6: [1, 7],   // Canh: Khôi Sửu, Việt Mùi
  7: [6, 2],   // Tân: Khôi Ngọ, Việt Dần
  8: [3, 5],   // Nhâm: Khôi Mão, Việt Tỵ
  9: [3, 5],   // Quý: Khôi Mão, Việt Tỵ
};

// Bảng Lộc Tồn (Can năm → chi Lộc Tồn)
export const LUCUN_TABLE: Record<number, number> = {
  0: 2,   // Giáp: Dần
  1: 3,   // Ất: Mão
  2: 5,   // Bính: Tỵ
  3: 6,   // Đinh: Ngọ
  4: 5,   // Mậu: Tỵ
  5: 6,   // Kỷ: Ngọ
  6: 8,   // Canh: Thân
  7: 9,   // Tân: Dậu
  8: 11,  // Nhâm: Hợi
  9: 0,   // Quý: Tý
};

// Bảng Thiên Mã (Tam hợp Chi năm → chi Thiên Mã)
// Dần Ngọ Tuất → Thân, Thân Tý Thìn → Dần, Tỵ Dậu Sửu → Hợi, Hợi Mão Mùi → Tỵ
export const TIANMA_TABLE: Record<number, number> = {
  2: 8,   // Năm Dần → Thân
  6: 8,   // Năm Ngọ → Thân
  10: 8,  // Năm Tuất → Thân
  8: 2,   // Năm Thân → Dần
  0: 2,   // Năm Tý → Dần
  4: 2,   // Năm Thìn → Dần
  5: 11,  // Năm Tỵ → Hợi
  9: 11,  // Năm Dậu → Hợi
  1: 11,  // Năm Sửu → Hợi
  11: 5,  // Năm Hợi → Tỵ
  3: 5,   // Năm Mão → Tỵ
  7: 5,   // Năm Mùi → Tỵ
};

// ★ Toàn bộ độ sáng các sao (chính tinh + phụ tinh) đã được chuyển sang algorithm.ts → astro.config({ brightness })
// Phạm vi ghi đè: 9 chính tinh + 3 phụ tinh (Văn Khúc / Linh Tinh / Kình Dương), tổng cộng 24 vị trí hiệu chỉnh khác biệt.
// Các sao còn lại (Vũ Khúc / Liêm Trinh / Tham Lang / Cự Môn / Phá Quân / Văn Xương / Hỏa Tinh / Đà La) mặc định của iztro đã khớp với Toàn Thư, không cần ghi đè.
// STAR_BRIGHTNESS cũ là mã chết (chưa từng được tham chiếu), đã được dọn dẹp vào ngày 2026-05-08.

// Mô tả chính tinh (hệ thống của Thầy Nghê)
export const STAR_DESCRIPTIONS: Record<string, { keywords: string; nature: string; element: string }> = {
  '紫微': { keywords: '帝王·尊贵·独立', nature: '中性偏吉', element: '土' },
  '天机': { keywords: '智慧·机变·谋略', nature: '吉星', element: '木' },
  '太阳': { keywords: '阳刚·官贵·慷慨', nature: '吉星', element: '火' },
  '武曲': { keywords: '财富·刚毅·果断', nature: '中性', element: '金' },
  '天同': { keywords: '温和·享福·随缘', nature: '吉星', element: '水' },
  '廉贞': { keywords: '才艺·刑囚·桃花', nature: '凶中带吉', element: '火' },
  '天府': { keywords: '财库·稳重·保守', nature: '吉星', element: '土' },
  '太阴': { keywords: '柔美·财富·阴柔', nature: '吉星', element: '水' },
  '贪狼': { keywords: '欲望·桃花·多才', nature: '中性', element: '木' },
  '巨门': { keywords: '口舌·是非·善辩', nature: '凶中带吉', element: '水' },
  '天相': { keywords: '辅佐·行政·印绶', nature: '吉星', element: '水' },
  '天梁': { keywords: '荫护·医药·长辈', nature: '吉星', element: '土' },
  '七杀': { keywords: '将星·果决·孤克', nature: '凶星', element: '金' },
  '破军': { keywords: '开创·变动·破坏', nature: '凶星', element: '水' },
};
