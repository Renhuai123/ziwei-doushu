/**
 * Tiếng Việt (Hán-Việt) cho Tử Vi Đẩu Số.
 *
 * Engine (lib/ziwei/*) vẫn dùng tên chữ Hán làm khoá nội bộ — mọi tra bảng, tứ hóa,
 * cách cục đều so khớp theo tên Hán. File này chỉ dịch ở tầng hiển thị: truyền tên Hán
 * vào, nhận tên Việt ra; không có trong bảng thì trả về nguyên văn.
 */

export const STEMS_VI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];

export const BRANCHES_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const PALACES: Record<string, string> = {
  '命宫': 'Mệnh', '命': 'Mệnh',
  '兄弟': 'Huynh Đệ',
  '夫妻': 'Phu Thê',
  '子女': 'Tử Tức',
  '财帛': 'Tài Bạch',
  '疾厄': 'Tật Ách',
  '迁移': 'Thiên Di',
  '仆役': 'Nô Bộc', '交友': 'Nô Bộc',
  '官禄': 'Quan Lộc',
  '田宅': 'Điền Trạch',
  '福德': 'Phúc Đức',
  '父母': 'Phụ Mẫu',
  '身宫': 'Thân',
};

const STARS: Record<string, string> = {
  // 14 chính tinh
  '紫微': 'Tử Vi', '天机': 'Thiên Cơ', '太阳': 'Thái Dương', '武曲': 'Vũ Khúc',
  '天同': 'Thiên Đồng', '廉贞': 'Liêm Trinh', '天府': 'Thiên Phủ', '太阴': 'Thái Âm',
  '贪狼': 'Tham Lang', '巨门': 'Cự Môn', '天相': 'Thiên Tướng', '天梁': 'Thiên Lương',
  '七杀': 'Thất Sát', '破军': 'Phá Quân',
  // Cát tinh / phụ tinh
  '左辅': 'Tả Phù', '右弼': 'Hữu Bật', '文昌': 'Văn Xương', '文曲': 'Văn Khúc',
  '天魁': 'Thiên Khôi', '天钺': 'Thiên Việt', '禄存': 'Lộc Tồn', '天马': 'Thiên Mã',
  '三台': 'Tam Thai', '八座': 'Bát Tọa', '凤阁': 'Phượng Các', '华盖': 'Hoa Cái',
  '台辅': 'Thai Phụ', '封诰': 'Phong Cáo', '恩光': 'Ân Quang', '天贵': 'Thiên Quý',
  '天喜': 'Thiên Hỷ', '红鸾': 'Hồng Loan', '天官': 'Thiên Quan', '天福': 'Thiên Phúc',
  '天寿': 'Thiên Thọ', '天才': 'Thiên Tài', '天巫': 'Thiên Vu', '天德': 'Thiên Đức',
  '月德': 'Nguyệt Đức', '年解': 'Niên Giải', '解神': 'Giải Thần', '龙池': 'Long Trì',
  '龙德': 'Long Đức', '天厨': 'Thiên Trù', '天姚': 'Thiên Diêu', '咸池': 'Hàm Trì',
  '劫煞': 'Kiếp Sát', '破碎': 'Phá Toái',
  // Sát tinh
  '擎羊': 'Kình Dương', '陀罗': 'Đà La', '火星': 'Hỏa Tinh', '铃星': 'Linh Tinh',
  '地空': 'Địa Không', '地劫': 'Địa Kiếp', '天刑': 'Thiên Hình', '天哭': 'Thiên Khốc',
  '天虚': 'Thiên Hư', '天月': 'Thiên Nguyệt', '天空': 'Thiên Không', '天伤': 'Thiên Thương',
  '天使': 'Thiên Sứ', '孤辰': 'Cô Thần', '寡宿': 'Quả Tú', '大耗': 'Đại Hao',
  '蜚廉': 'Phi Liêm', '阴煞': 'Âm Sát', '截空': 'Triệt Không', '旬空': 'Tuần Không',
  '副截': 'Phó Triệt', '副旬': 'Phó Tuần',
};

const SIHUA: Record<string, string> = { '禄': 'Lộc', '权': 'Quyền', '科': 'Khoa', '忌': 'Kỵ' };

const BRIGHTNESS: Record<string, string> = {
  '庙': 'Miếu', '旺': 'Vượng', '得': 'Đắc', '利': 'Lợi', '平': 'Bình',
  '不': 'Bất', '闲': 'Nhàn', '陷': 'Hãm', '地': 'Địa',
};

const MISC: Record<string, string> = {
  '水二局': 'Thủy Nhị Cục', '木三局': 'Mộc Tam Cục', '金四局': 'Kim Tứ Cục',
  '土五局': 'Thổ Ngũ Cục', '火六局': 'Hỏa Lục Cục',
  '阳男': 'Dương Nam', '阴男': 'Âm Nam', '阳女': 'Dương Nữ', '阴女': 'Âm Nữ',
};

/** Tên cung: '财帛' / '财帛宫' → 'Tài Bạch' */
export function viPalace(name: string): string {
  return PALACES[name] ?? PALACES[name.replace(/宫$/, '')] ?? name;
}

export function viStar(name: string): string {
  return STARS[name] ?? name;
}

/** '禄' → 'Lộc' */
export function viSiHua(siHua: string): string {
  return SIHUA[siHua] ?? siHua;
}

export function viBrightness(b: string): string {
  return BRIGHTNESS[b] ?? b;
}

/** Cục ngũ hành, âm dương nam nữ… */
export function viTerm(term: string): string {
  return MISC[term] ?? term;
}

export function viGanzhi(stem: number, branch: number): string {
  return `${STEMS_VI[stem]} ${BRANCHES_VI[branch]}`;
}

export const SHICHEN_RANGES = [
  '23:00–01:00', '01:00–03:00', '03:00–05:00', '05:00–07:00', '07:00–09:00', '09:00–11:00',
  '11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00', '19:00–21:00', '21:00–23:00',
];

/** 'UTC+7', 'UTC+8', 'UTC+5:30' */
export function formatUtcOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}
