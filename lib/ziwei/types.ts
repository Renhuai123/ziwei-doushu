export interface BirthInfo {
  year: number;      // Năm Dương lịch (ngày lập lá số đã qua hiệu chỉnh đổi ngày giờ Tý)
  month: number;     // Tháng Dương lịch (1-12)
  day: number;       // Ngày Dương lịch
  hour: number;      // Chỉ số Địa chi của giờ sinh (0=Tý, 1=Sửu, ... 11=Hợi)
  gender: 'male' | 'female';
  name?: string;
  province?: string;   // Tỉnh/thành sinh
  city?: string;       // Thành phố/quận huyện sinh
  longitude?: number;  // Kinh độ nơi sinh (dùng để hiệu chỉnh giờ Thái dương thật)
  /**
   * Dữ liệu nhập gốc (thời gian người dùng thực tế điền vào biểu mẫu), luôn giữ lại khi biết giờ sinh.
   * Ví dụ: người dùng nhập 5/9 23:55 → year/month/day sẽ đổi thành 5/10 (giờ Tý ngày hôm sau),
   *     trong khi tại đây lưu lại bản gốc { year:Y, month:5, day:9, clockHour:23, clockMinute:55 },
   *     dùng để hiển thị trên trang lá số cho người dùng biết "Đã chuyển sang ngày hôm sau theo quy tắc đổi ngày giờ Tý".
   */
  origInput?: {
    year: number;
    month: number;
    day: number;
    clockHour: number;
    clockMinute: number;
  };
}

export interface LunarInfo {
  lunarYear: number;
  lunarMonth: number;    // dương = tháng thường, âm = tháng nhuận
  lunarDay: number;
  yearStem: number;      // 0-9 (Giáp Ất Bính Đinh Mậu Kỷ Canh Tân Nhâm Quý)
  yearBranch: number;    // 0-11 (Tý Sửu Dần Mão Thìn Tỵ Ngọ Mùi Thân Dậu Tuất Hợi)
  isLeapMonth: boolean;
  /** Tứ trụ theo Tiết khí (trụ Năm/Tháng/Ngày/Giờ), ví dụ: ["壬午","壬子","壬戌","庚戌"] */
  fourPillars?: [string, string, string, string];
  /** Tứ trụ phi tiết khí (theo lịch Âm: mùng 1 tháng Giêng đổi năm + tháng Âm lịch, cùng hệ lịch với Tử Vi) — vào ngày giao tiết khí thì trụ tháng sẽ khác với fourPillars */
  fourPillarsLunar?: [string, string, string, string];
}

export type SiHua = '禄' | '权' | '科' | '忌';

/** Độ sáng của sao gồm 8 mức (chuẩn Tử Vi Đẩu Số) — '地' (Địa) là cấp độ bổ sung của XD1 (Bảng độ sáng hiệu chỉnh hiện đại bản 1) */
export type StarBrightness = '庙' | '旺' | '得' | '利' | '平' | '不' | '闲' | '陷' | '地';

export interface Star {
  name: string;
  type: 'major' | 'minor' | 'lucky' | 'sha';
  siHua?: SiHua;
  /** Độ sáng phân loại thô (giữ lại để tương thích ngược, dùng trong phán đoán thuật toán) */
  brightness?: 'bright' | 'normal' | 'dim';
  /** 7 mức độ sáng nguyên bản (Miếu/Vượng/Đắc/Lợi/Bình/Bất/Hãm - 庙/旺/得/利/平/不/陷) — dùng cho tầng hiển thị */
  brightnessRaw?: StarBrightness;
}

export interface SelfSihuaMark {
  siHua: SiHua;       // Lộc/Quyền/Khoa/Kỵ (禄/权/科/忌)
  starName: string;   // Sao tự hóa
}

export interface Palace {
  branch: number;      // 0-11 (Chỉ số Địa chi)
  stem: number;        // 0-9 (Chỉ số Thiên can)
  name: string;        // Tên cung
  stars: Star[];
  daXianAge?: [number, number];   // Độ tuổi Đại hạn
  isCurrentDaXian?: boolean;
  isMingGong?: boolean;
  isShenGong?: boolean;
  /** Tự hóa theo can cung (trọng tâm trong hệ thống của Thầy Nghê) */
  selfSihua?: SelfSihuaMark[];
  /** Chỉ số Địa chi cung đối diện (luôn = (branch + 6) % 12) */
  oppositeBranch?: number;
  /** Có phải cung vô chính diệu (không có chính tinh) không */
  isEmpty?: boolean;
  /** Nếu là cung vô chính diệu, mượn từ chỉ số Địa chi của cung nào = oppositeBranch */
  borrowedFromBranch?: number;
  /** Nếu là cung vô chính diệu, mượn từ tên cung nào */
  borrowedFromName?: string;
  /** Nếu là cung vô chính diệu, danh sách tên chính tinh mượn từ cung đối diện (dữ liệu có cấu trúc, tầng nội dung không cần tra cứu ngược từ văn bản) */
  borrowedStars?: string[];
}

export interface DaXianSiHua {
  stemIndex: number;
  stemName: string;
  lu: string;    // Tên sao Hóa Lộc
  quan: string;  // Tên sao Hóa Quyền
  ke: string;    // Tên sao Hóa Khoa
  ji: string;    // Tên sao Hóa Kỵ
}

export interface DaXian {
  startAge: number;
  endAge: number;
  palaceBranch: number;
  palaceName: string;
  stemIndex?: number;    // Chỉ số Thiên can của cung Đại hạn (dùng cho Tứ Hóa Đại hạn)
  stemName?: string;
  siHua?: DaXianSiHua;   // Tứ Hóa của Đại hạn này (dựa trên can cung)
}

export interface ZiweiChart {
  birthInfo: BirthInfo;
  lunarInfo: LunarInfo;
  mingGongBranch: number;    // Địa chi cung Mệnh
  shenGongBranch: number;    // Địa chi cung Thân
  wuxingJu: number;          // Cục số Ngũ hành (2, 3, 4, 5, 6)
  wuxingJuName: string;      // ví dụ: '水二局' (Thủy Nhị Cục)
  ziweiPos: number;          // Vị trí sao Tử Vi
  palaces: Palace[];         // 12 cung, sắp xếp theo Địa chi 0-11
  daXians: DaXian[];
  currentAge: number;
  currentDaXianIndex: number;
  /** Signed analysis-cache eligibility marker assigned by /api/generate. */
  analysisCacheProfile?: string;
  /** Sao Mệnh Chủ (tra bảng theo Địa chi cung Mệnh) */
  mingZhu?: string;
  /** Sao Thân Chủ (tra bảng theo Địa chi năm sinh) */
  shenZhu?: string;
  /** Giới tính Âm Dương (Dương Nam / Âm Nam / Dương Nữ / Âm Nữ) */
  yinYangGender?: string;
}
