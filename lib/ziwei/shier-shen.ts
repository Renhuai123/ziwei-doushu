/**
 * Tướng Tiền Thập Nhị Thần / Tuế Tiền Thập Nhị Thần — Hai nhóm 12 thần an theo Địa chi
 *
 * Lý do tạo file này (2026-08-12):
 *   Các phần mềm lập lá số dòng chính trên mỗi cung đều có tên hai thần này, còn lá số của chúng ta trước đây để trống.
 *
 * ── Đính chính quan trọng (chú ý, không làm theo kết luận cũ) ──────────────────────────────
 *   Nhận định trước đây cho rằng "Tuế Tiền Thập Nhị Thần các phần mềm dòng chính không an, bảng LNSQX không có tác dụng". Đúng là không cần bảng tra,
 *   nhưng kết luận đó đã sai: các phần mềm dòng chính CÓ AN, chỉ là không tra bảng mà tính theo công thức;
 *   Mỗi tầng Đại Hạn / Lưu Niên / Lưu Nguyệt / Lưu Nhật / Lưu Thời / Tiểu Hạn đều được an, và mặc định đều bật.
 *
 * Xuất xứ thuật toán (tổng hợp theo chuẩn thông dụng, đã đối soát qua lá số chuẩn vàng):
 *
 *   Tuế Tiền Thập Nhị Thần — Tính theo công thức, không tra bảng
 *       Với cung g = 1..12: Thứ tự thần = 13 - Chi khởi điểm + g, nếu > 12 thì -12
 *       Tức "sao Tuế Kiến đóng tại cung có Chi khởi điểm, an thuận 12 cung". Tương đương từng ô với bảng LNSQX (đã kiểm chứng qua script đối soát).
 *
 *   Tướng Tiền Thập Nhị Thần — Tra bảng LNJQX
 *       Với thứ tự thần s = 1..12: Thần đó đóng tại cung LNJQX[s][Chi khởi điểm]
 *       Tức "thần thứ s đóng tại cung LNJQX[thứ tự thần][Chi khởi điểm]".
 *
 *   ★ Khởi điểm của cả hai nhóm đều là 【Địa chi】, và đều là 【Địa chi của vận hạn đó】:
 *     Mỗi vận hạn (Đại Hạn / Lưu Niên / Lưu Nguyệt / Lưu Nhật / Lưu Thời) đều theo cùng một quy tắc:
 *         Bật công tắc đi theo vận hạn → Tuế Tiền (Chi của tầng đó), ngược lại Tuế Tiền (Chi năm sinh)
 *         Bật công tắc đi theo vận hạn → Tướng Tiền (Chi của tầng đó), ngược lại Tướng Tiền (Chi năm sinh)
 *     Cả hai công tắc mặc định đều bật,
 *     tức mặc định đi theo vận hạn; ở trạng thái Bản Mệnh (chưa chọn vận hạn) thì vô điều kiện khởi từ Chi năm sinh.
 *
 * Mã hóa cung vị: Trong bảng quy ước 【Tý khởi 1】 (1=Tý ... 12=Hợi). Nhóm này có thể tự kiểm chứng độc lập:
 *   Cột Tướng Tinh của LNJQX = Đế Vượng của Tam hợp (Thân Tý Thìn → Tý, Dần Ngọ Tuất → Ngọ, Tỵ Dậu Sửu → Dậu, Hợi Mão Mùi → Mão) đúng 12/12 trường hợp;
 *   Cột Tuế Dịch giống từng ô với bảng Thiên Mã, cột Hoa Cái giống bảng Hoa Cái, cột Hàm Trì giống bảng Hàm Trì. Nếu tính khởi 1 từ Dần thì sai toàn bộ.
 *
 * File này khi giao tiếp bên ngoài đồng nhất dùng chỉ số Địa chi 0-11 (0=Tý).
 *
 * Bác Sĩ Thập Nhị Thần (Đối soát lá số chuẩn vàng 2026-08-14): Khởi từ Lộc Tồn năm sinh, Dương Nam Âm Nữ đi thuận, Âm Nam Dương Nữ đi nghịch; không đi theo vận hạn.
 */

import { LUCUN_TABLE } from './constants';

/** Tướng Tiền Thập Nhị Thần, khởi thuận từ Tướng Tinh. Chỉ số 0-11 = thứ tự thần. */
export const JIANG_QIAN_SHEN = [
  '将星', '攀鞍', '岁驿', '息神', '华盖', '劫煞',
  '灾煞', '天煞', '指背', '咸池', '月煞', '亡神',
] as const;

/** Tuế Tiền Thập Nhị Thần, khởi thuận từ Tuế Kiến. Chỉ số 0-11 = thứ tự thần.
 * Vị trí thứ 7 trên giao diện lá số dòng chính ghi là "Tuế Phá" (cung đối diện Tuế Kiến), không ghi là "Đại Hao" — Đại Hao theo Chi năm ở thanh trên cùng là một sao khác. */
export const SUI_QIAN_SHEN = [
  '岁建', '晦气', '丧门', '贯索', '官符', '小耗',
  '岁破', '龙德', '白虎', '天德', '吊客', '病符',
] as const;

/**
 * Bác Sĩ Thập Nhị Thần. Lá số chuẩn vàng: Bác Sĩ Thập Nhị Thần được liệt kê ở dòng đầu tiên dưới đáy cung.
 * Khởi từ Lộc Tồn năm sinh; Dương Nam Âm Nữ đi thuận, Âm Nam Dương Nữ đi nghịch. Không đi theo vận hạn (khi chọn Lưu Niên vẫn an tại cung Lộc Tồn năm sinh).
 */
export const BOSHI_SHEN = [
  '博士', '力士', '青龙', '小耗', '将军', '奏书',
  '飞廉', '喜神', '病符', '大耗', '伏兵', '官符',
] as const;

/**
 * Cung an Tướng Tinh (chỉ số Địa chi 0-11) — Vị trí Đế Vượng của Tam hợp cục.
 * Thân Tý Thìn → Tý, Dần Ngọ Tuất → Ngọ, Tỵ Dậu Sửu → Dậu, Hợi Mão Mùi → Mão; tức các chi cùng nhóm Tam hợp dùng chung một cung an Tướng Tinh.
 * anchorBranch là Địa chi của vận hạn đó (trạng thái Bản Mệnh truyền vào Chi năm sinh).
 */
export function jiangXingBranch(anchorBranch: number): number {
  const b = ((anchorBranch % 12) + 12) % 12;
  // Tý(0)/Thìn(4)/Thân(8) → Tý(0); Sửu(1)/Tỵ(5)/Dậu(9) → Dậu(9);
  // Dần(2)/Ngọ(6)/Tuất(10) → Ngọ(6); Mão(3)/Mùi(7)/Hợi(11) → Mão(3)
  return [0, 9, 6, 3][b % 4];
}

/**
 * Tướng Tiền Thập Nhị Thần: Trả về mảng độ dài 12, chỉ số mảng = Địa chi của cung (0-11), giá trị = thứ tự thần (0-11, 0=Tướng Tinh).
 * Tướng Tinh khởi từ vị trí Đế Vượng Tam hợp, 11 thần tiếp theo đi thuận.
 */
export function jiangQianShenByBranch(anchorBranch: number): number[] {
  const start = jiangXingBranch(anchorBranch);
  const out = new Array<number>(12);
  for (let shen = 0; shen < 12; shen++) out[(start + shen) % 12] = shen;
  return out;
}

/**
 * Tuế Tiền Thập Nhị Thần: Trả về mảng độ dài 12, chỉ số mảng = Địa chi của cung (0-11), giá trị = thứ tự thần (0-11, 0=Tuế Kiến).
 * Tuế Kiến đóng tại cung anchorBranch, 11 thần tiếp theo đi thuận.
 */
export function suiQianShenByBranch(anchorBranch: number): number[] {
  const a = ((anchorBranch % 12) + 12) % 12;
  const out = new Array<number>(12);
  for (let shen = 0; shen < 12; shen++) out[(a + shen) % 12] = shen;
  return out;
}

/** Hàm tiện ích: Tên Tướng Tiền Thập Nhị Thần của một cung nhất định. */
export function jiangQianShenName(anchorBranch: number, palaceBranch: number): string {
  return JIANG_QIAN_SHEN[jiangQianShenByBranch(anchorBranch)[((palaceBranch % 12) + 12) % 12]];
}

/** Hàm tiện ích: Tên Tuế Tiền Thập Nhị Thần của một cung nhất định. */
export function suiQianShenName(anchorBranch: number, palaceBranch: number): string {
  return SUI_QIAN_SHEN[suiQianShenByBranch(anchorBranch)[((palaceBranch % 12) + 12) % 12]];
}

/** Dương Nam Âm Nữ đi thuận, Âm Nam Dương Nữ đi nghịch. Âm Dương của Can năm cùng một quy tắc với calcYinYangGender. */
export function boshiReverse(yearStem: number, gender: 'male' | 'female'): boolean {
  const yangStem = ((yearStem % 10) + 10) % 10 % 2 === 0;
  return yangStem !== (gender === 'male');
}

/**
 * Bác Sĩ Thập Nhị Thần: Trả về mảng độ dài 12, chỉ số mảng = Địa chi của cung (0-11), giá trị = thứ tự thần (0-11, 0=Bác Sĩ).
 * Khởi điểm = Lộc Tồn năm sinh.
 */
export function boshiShenByStem(yearStem: number, gender: 'male' | 'female'): number[] {
  const start = LUCUN_TABLE[((yearStem % 10) + 10) % 10];
  const reverse = boshiReverse(yearStem, gender);
  const out = new Array<number>(12);
  for (let shen = 0; shen < 12; shen++) {
    const branch = reverse ? (start - shen + 12) % 12 : (start + shen) % 12;
    out[branch] = shen;
  }
  return out;
}

export function boshiShenName(
  yearStem: number, gender: 'male' | 'female', palaceBranch: number,
): string {
  return BOSHI_SHEN[boshiShenByStem(yearStem, gender)[((palaceBranch % 12) + 12) % 12]];
}

/**
 * Tên tiếng Anh của Thập Nhị Thần — Bảng chuyên dụng
 *
 * Vì sao tách riêng một bảng mà không dùng trực tiếp từ điển cụm từ chia sẻ t():
 * Từ điển ánh xạ 1-1 "mục từ → bản dịch", trong khi cùng một từ tiếng Trung ở ngữ cảnh khác nhau cần dịch khác nhau —
 * "Tướng Tinh" khi là một trong Tướng Tiền Thập Nhị Thần thì dùng bính âm Pinyin (đồng nhất với 23 thần khác), nhưng trong văn tản luận lại là tên gọi khác của 【Thất Sát】
 * ("Tù tinh phối Tướng tinh" = Liêm Trinh phối Thất Sát), ở đó dịch là General Star mới thông nghĩa. Dùng chung một bảng sớm muộn cũng xung đột.
 *
 * Ngày 2026-08-12 đã thống nhất các mục từ riêng lẻ Đại Hao / Tướng Tinh / Bát Tọa trong từ điển sang bính âm (trước đây dịch nghĩa, là 3 trường hợp dị biệt trong 25 tạp diệu),
 * vì vậy hiện tại kết quả hai bên đồng nhất; ý nghĩa của bảng này là tách biệt nhãn tên sao trên lá số khỏi từ điển văn bản xuôi,
 * sau này dù có ai sửa từ điển cũng không làm lệch cột này.
 *
 * Quy chuẩn: Danh từ riêng mệnh lý dùng bính âm Pinyin (xem chỉ thị tiếng Anh trong /api/interpret "Keep 命理 proper nouns as pinyin+English").
 */
export const SHIER_SHEN_EN: Record<string, string> = {
  // Tuế Tiền Thập Nhị Thần (Tuế Phá = chữ dùng trên giao diện lá số dòng chính; Đại Hao dành cho sao Chi năm ở thanh trên cùng / thần thứ 12 của Bác Sĩ)
  岁建: 'Sui Jian', 晦气: 'Hui Qi', 丧门: 'Sang Men', 贯索: 'Guan Suo',
  官符: 'Guan Fu', 小耗: 'Xiao Hao', 岁破: 'Sui Po', 大耗: 'Da Hao', 龙德: 'Long De',
  白虎: 'Bai Hu', 天德: 'Tian De', 吊客: 'Diao Ke', 病符: 'Bing Fu',
  // Tướng Tiền Thập Nhị Thần
  将星: 'Jiang Xing', 攀鞍: 'Pan An', 岁驿: 'Sui Yi', 息神: 'Xi Shen',
  华盖: 'Hua Gai', 劫煞: 'Jie Sha', 灾煞: 'Zai Sha', 天煞: 'Tian Sha',
  指背: 'Zhi Bei', 咸池: 'Xian Chi', 月煞: 'Yue Sha', 亡神: 'Wang Shen',
  // Bác Sĩ Thập Nhị Thần (các từ trùng tên với Tuế Tiền dùng chung bính âm)
  博士: 'Bo Shi', 力士: 'Li Shi', 青龙: 'Qing Long', 将军: 'Jiang Jun',
  奏书: 'Zou Shu', 飞廉: 'Fei Lian', 喜神: 'Xi Shen', 伏兵: 'Fu Bing',
};

/** Lấy tên hiển thị Thập Nhị Thần theo ngôn ngữ; nếu chưa thu thập thì trả về nguyên bản tiếng Trung, tuyệt đối không hiển thị undefined. */
export function shierShenLabel(name: string, lang: string): string {
  return lang === 'en' ? (SHIER_SHEN_EN[name] ?? name) : name;
}
