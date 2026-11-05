/**
 * Lớp hiển thị: tra chữ Hán gốc (dùng làm khóa logic trong engine) → nhãn tiếng Việt (Hán Việt).
 * KHÔNG dùng các nhãn tiếng Việt này làm khóa so sánh/tra cứu trong logic — chỉ dùng khi render UI.
 * Nguồn thuật ngữ: docs/i18n/glossary-ziwei.md — cập nhật đồng thời khi thêm thuật ngữ mới.
 */

const PALACE_NAME_VI: Record<string, string> = {
  // Dạng có hậu tố "宫" (dùng trong constants.ts/PALACE_NAMES_ORDER và văn bản cổ thư)
  '命宫': 'Cung Mệnh',
  '兄弟宫': 'Cung Huynh Đệ',
  '夫妻宫': 'Cung Phu Thê',
  '子女宫': 'Cung Tử Nữ',
  '财帛宫': 'Cung Tài Bạch',
  '疾厄宫': 'Cung Tật Ách',
  '迁移宫': 'Cung Thiên Di',
  '交友宫': 'Cung Giao Hữu',
  '官禄宫': 'Cung Quan Lộc',
  '田宅宫': 'Cung Điền Trạch',
  '福德宫': 'Cung Phúc Đức',
  '父母宫': 'Cung Phụ Mẫu',
  '身宫': 'Cung Thân',
  // Dạng không hậu tố "宫" (thư viện iztro dùng cho Palace.name, xem node_modules/iztro/lib/i18n/locales/zh-CN/palace.js)
  '兄弟': 'Cung Huynh Đệ',
  '夫妻': 'Cung Phu Thê',
  '子女': 'Cung Tử Nữ',
  '财帛': 'Cung Tài Bạch',
  '疾厄': 'Cung Tật Ách',
  '迁移': 'Cung Thiên Di',
  '仆役': 'Cung Giao Hữu',
  '官禄': 'Cung Quan Lộc',
  '田宅': 'Cung Điền Trạch',
  '福德': 'Cung Phúc Đức',
  '父母': 'Cung Phụ Mẫu',
  '来因': 'Cung Lai Nhân',
};

const STAR_NAME_VI: Record<string, string> = {
  '紫微': 'Tử Vi', '天机': 'Thiên Cơ', '太阳': 'Thái Dương', '武曲': 'Vũ Khúc',
  '天同': 'Thiên Đồng', '廉贞': 'Liêm Trinh', '天府': 'Thiên Phủ', '太阴': 'Thái Âm',
  '贪狼': 'Tham Lang', '巨门': 'Cự Môn', '天相': 'Thiên Tướng', '天梁': 'Thiên Lương',
  '七杀': 'Thất Sát', '破军': 'Phá Quân',
  '文昌': 'Văn Xương', '文曲': 'Văn Khúc', '左辅': 'Tả Phụ', '右弼': 'Hữu Bật',
  '天魁': 'Thiên Khôi', '天钺': 'Thiên Việt', '禄存': 'Lộc Tồn', '天马': 'Thiên Mã',
  '擎羊': 'Kình Dương', '陀罗': 'Đà La', '火星': 'Hỏa Tinh', '铃星': 'Linh Tinh',
  '地空': 'Địa Không', '地劫': 'Địa Kiếp', '天刑': 'Thiên Hình', '天姚': 'Thiên Diêu',
  '天哭': 'Thiên Khốc', '天虚': 'Thiên Hư', '天月': 'Thiên Nguyệt', '阴煞': 'Âm Sát',
  '蜚廉': 'Phi Liêm', '空亡': 'Không Vong', '孤辰': 'Cô Thần', '寡宿': 'Quả Tú',
  '天官': 'Thiên Quan', '天福': 'Thiên Phúc', '天才': 'Thiên Tài', '天寿': 'Thiên Thọ',
  '三台': 'Tam Thai', '八座': 'Bát Tọa', '恩光': 'Ân Quang', '天贵': 'Thiên Quý',
  '台辅': 'Thai Phụ', '龙池': 'Long Trì', '凤阁': 'Phượng Các', '红鸾': 'Hồng Loan',
  '天喜': 'Thiên Hỷ', '解神': 'Giải Thần', '天德': 'Thiên Đức', '月德': 'Nguyệt Đức',
  '年解': 'Niên Giải', '天巫': 'Thiên Vu', '华盖': 'Hoa Cái', '封诰': 'Phong Cáo',
  '破碎': 'Phá Toái', '天厨': 'Thiên Trù',
  // Nhóm Tuần Không / Triệt Không và sao phụ hiếm gặp (xem SHA_STARS trong lib/ziwei/algorithm.ts)
  '天空': 'Thiên Không', '旬空': 'Tuần Không', '副旬': 'Phó Tuần',
  '截路': 'Triệt Lộ', '截空': 'Triệt Không', '副截': 'Phó Triệt',
  '大耗': 'Đại Hao', '天使': 'Thiên Sứ', '天伤': 'Thiên Thương',
};

const SIHUA_NAME_VI: Record<string, string> = {
  '化禄': 'Hóa Lộc', '化权': 'Hóa Quyền', '化科': 'Hóa Khoa', '化忌': 'Hóa Kỵ',
};

const SHISHEN_NAME_VI: Record<string, string> = {
  '将星': 'Tướng Tinh', '攀鞍': 'Phàn Yên', '岁驿': 'Tuế Dịch', '息神': 'Tức Thần',
  '劫煞': 'Kiếp Sát', '灾煞': 'Tai Sát', '天煞': 'Thiên Sát', '指背': 'Chỉ Bối',
  '咸池': 'Hàm Trì', '月煞': 'Nguyệt Sát', '亡神': 'Vong Thần',
  '岁建': 'Tuế Kiến', '晦气': 'Hối Khí', '丧门': 'Tang Môn', '贯索': 'Quán Sách',
  '官符': 'Quan Phù', '小耗': 'Tiểu Hao', '岁破': 'Tuế Phá', '龙德': 'Long Đức',
  '白虎': 'Bạch Hổ', '吊客': 'Điếu Khách', '病符': 'Bệnh Phù',
  '博士': 'Bác Sĩ', '力士': 'Lực Sĩ', '青龙': 'Thanh Long', '将军': 'Tướng Quân',
  '奏书': 'Tấu Thư', '喜神': 'Hỷ Thần', '大耗': 'Đại Hao', '伏兵': 'Phục Binh',
};

const STEM_NAME_VI: Record<string, string> = {
  '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
  '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý',
};

const BRANCH_NAME_VI: Record<string, string> = {
  '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ',
  '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi',
};

const ELEMENT_NAME_VI: Record<string, string> = {
  '金': 'Kim', '木': 'Mộc', '水': 'Thủy', '火': 'Hỏa', '土': 'Thổ',
};

const JU_NAME_VI: Record<string, string> = {
  '水二局': 'Thủy Nhị Cục', '木三局': 'Mộc Tam Cục', '金四局': 'Kim Tứ Cục',
  '土五局': 'Thổ Ngũ Cục', '火六局': 'Hỏa Lục Cục',
};

function lookup(dict: Record<string, string>, key: string): string {
  return dict[key] ?? key;
}

export function paName(hanzi: string): string {
  return lookup(PALACE_NAME_VI, hanzi);
}

export function starName(hanzi: string): string {
  return lookup(STAR_NAME_VI, hanzi);
}

export function sihuaName(hanzi: string): string {
  return lookup(SIHUA_NAME_VI, hanzi);
}

export function shishenName(hanzi: string): string {
  return lookup(SHISHEN_NAME_VI, hanzi);
}

export function stemName(hanzi: string): string {
  return lookup(STEM_NAME_VI, hanzi);
}

export function branchName(hanzi: string): string {
  return lookup(BRANCH_NAME_VI, hanzi);
}

export function elementName(hanzi: string): string {
  return lookup(ELEMENT_NAME_VI, hanzi);
}

export function juName(hanzi: string): string {
  return lookup(JU_NAME_VI, hanzi);
}

/** Tra theo bất kỳ loại nào, dùng khi không biết trước danh mục (ví dụ render danh sách hỗn hợp). */
export function anyTermName(hanzi: string): string {
  return (
    PALACE_NAME_VI[hanzi] ??
    STAR_NAME_VI[hanzi] ??
    SIHUA_NAME_VI[hanzi] ??
    SHISHEN_NAME_VI[hanzi] ??
    STEM_NAME_VI[hanzi] ??
    BRANCH_NAME_VI[hanzi] ??
    ELEMENT_NAME_VI[hanzi] ??
    hanzi
  );
}
