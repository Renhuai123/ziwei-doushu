/**
 * 名人命盘数据库
 * 基于公开记录的出生日期，时辰为估算值（部分有文献记载）
 */

import 'server-only';

export interface FamousPerson {
  id: string;
  name: string;
  nameEn: string;
  category: '商业' | '文艺' | '历史' | '体育' | '科技';
  description: string;           // 一句话身份介绍
  descriptionEn: string;
  year: number;
  month: number;
  day: number;
  hour: number;                  // 时辰地支索引 0-11
  gender: 'male' | 'female';
  notable: string;               // 命盘亮点提示（启发用户兴趣）
  notableEn: string;
}

export const FAMOUS_PERSONS: FamousPerson[] = [
  // ─── 商业传奇 ─────────────────────────────────────────────
  {
    id: 'ma-yun',
    name: '马云',
    nameEn: 'Jack Ma',
    category: '商业',
    description: 'Nhà sáng lập Alibaba',
    descriptionEn: 'Founder of Alibaba',
    year: 1964, month: 9, day: 10, hour: 5,  // 约巳时
    gender: 'male',
    notable: 'Lá số hiển lộ sức mạnh phá cách tái thiết cực kỳ mãnh liệt, các sao tại Cung Quan Lộc tương ứng sâu sắc với đế chế thương mại Internet',
    notableEn: 'The chart shows an exceptional ability to break established patterns and rebuild, while the Career Palace closely parallels the rise of an internet business empire.',
  },
  {
    id: 'li-jiacheng',
    name: '李嘉诚',
    nameEn: 'Li Ka-shing',
    category: '商业',
    description: 'Siêu tỷ phú Hồng Kông, nhà sáng lập hệ thống tập đoàn Trường Hòa',
    descriptionEn: 'Hong Kong billionaire and founder of the CK Hutchison business empire',
    year: 1928, month: 7, day: 29, hour: 3,  // 约卯时
    gender: 'male',
    notable: 'Tứ Hóa tại Cung Tài Bạch là điển lệ tuyệt hảo để nghiên cứu lá số bậc phú hào hàng đầu phương Đông; Lộc Tồn thủ tài, càng tích lũy càng dày dặn',
    notableEn: 'The Four Transformations in the Wealth Palace make this a compelling case study of extraordinary wealth; Lu Cun preserves assets and supports steady accumulation.',
  },
  {
    id: 'ren-zhengfei',
    name: '任正非',
    nameEn: 'Ren Zhengfei',
    category: '商业',
    description: 'Nhà sáng lập Huawei',
    descriptionEn: 'Founder of Huawei',
    year: 1944, month: 10, day: 25, hour: 3, // 卯时
    gender: 'male',
    notable: 'Cách Cục Thất Sát nhập Mệnh, một đời ngược gió tiến bước, càng bị chèn ép càng hùng mạnh, là minh chứng sống động cho lý luận Thất Sát của thầy Nghê',
    notableEn: 'Qi Sha in the Life Palace points to a life strengthened by adversity—the greater the pressure, the stronger the response—making this a vivid case study of traditional Qi Sha theory.',
  },

  // ─── 文艺名人 ─────────────────────────────────────────────
  {
    id: 'zhang-ailing',
    name: '张爱玲',
    nameEn: 'Eileen Chang',
    category: '文艺',
    description: 'Bậc đại danh gia văn học hiện đại Trung Quốc',
    descriptionEn: 'A master of modern Chinese literature',
    year: 1920, month: 9, day: 30, hour: 1, // 丑时
    gender: 'female',
    notable: 'Tổ hợp các sao cô độc trên lá số tạo nên sự đối chiếu kỳ diệu với hành trình tình cảm huyền thoại và thành tựu văn chương của bà',
    notableEn: 'The chart’s combination of solitary stars forms a striking parallel with her celebrated romantic history and literary achievements.',
  },
  {
    id: 'jay-chou',
    name: '周杰伦',
    nameEn: 'Jay Chou',
    category: '文艺',
    description: 'Thiên vương nhạc nhẹ Hoa ngữ',
    descriptionEn: 'Mandopop singer-songwriter and cultural icon',
    year: 1979, month: 1, day: 18, hour: 1,  // 丑时（据报道夜间出生）
    gender: 'male',
    notable: 'Tổ hợp sao Văn Khúc và Tham Lang, bản mệnh thiên phú tài nghệ; lá số lý giải vì sao anh có thể tung hoành qua nhiều phong cách âm nhạc khác nhau',
    notableEn: 'The combination of Wen Qu and Tan Lang suggests natural artistic talent and helps explain his ability to move across musical styles.',
  },
  {
    id: 'wang-fei',
    name: '王菲',
    nameEn: 'Faye Wong',
    category: '文艺',
    description: 'Nữ danh ca mang màu sắc huyền thoại bậc nhất làng nhạc Hoa ngữ',
    descriptionEn: 'One of the most iconic singers in Chinese pop',
    year: 1969, month: 8, day: 8, hour: 4,   // 辰时
    gender: 'female',
    notable: 'Các sao tại Cung Phu Thê tương ứng sâu sắc với hai cuộc hôn nhân huyền thoại của cô, Cách Cục tình cảm rất có giá trị nghiên cứu',
    notableEn: 'The stars in the Marriage Palace closely parallel her two high-profile marriages, making the relationship pattern especially valuable for study.',
  },
  {
    id: 'lin-zhiling',
    name: '林志玲',
    nameEn: 'Lin Chi-ling',
    category: '文艺',
    description: 'Siêu mẫu, diễn viên nổi tiếng Đài Loan',
    descriptionEn: 'Taiwanese model and actress',
    year: 1974, month: 11, day: 29, hour: 5, // 巳时
    gender: 'female',
    notable: 'Hình mẫu điển hình về nhan sắc nữ giới có Thái Âm thủ Mệnh; lá số minh chứng hoàn hảo cho luận đoán "con gái có Thái Âm nhập Mệnh là xinh đẹp nhất" của thầy Nghê',
    notableEn: 'Tai Yin guarding the Life Palace is a classic symbol of feminine grace, closely echoing the traditional view that this placement bestows exceptional beauty.',
  },

  // ─── 科技精英 ─────────────────────────────────────────────
  {
    id: 'steve-jobs',
    name: '乔布斯',
    nameEn: 'Steve Jobs',
    category: '科技',
    description: 'Đồng sáng lập công ty Apple',
    descriptionEn: 'Co-founder of Apple',
    year: 1955, month: 2, day: 24, hour: 6,  // 午时
    gender: 'male',
    notable: 'Cách Cục Phá Quân nhập Mệnh, bị cha mẹ ruột bỏ rơi rồi lại sáng lập đế chế Apple, là hình mẫu điển hình của lá số phá nhi hậu lập',
    notableEn: 'Po Jun in the Life Palace, adoption at birth, and the creation of the Apple empire make this an archetypal chart of renewal after disruption.',
  },
  {
    id: 'elon-musk',
    name: '马斯克',
    nameEn: 'Elon Musk',
    category: '科技',
    description: 'Nhà sáng lập Tesla và SpaceX',
    descriptionEn: 'Founder of SpaceX and CEO of Tesla',
    year: 1971, month: 6, day: 28, hour: 4,  // 辰时（7:30AM 有文献记录）
    gender: 'male',
    notable: 'Thể hiện tột cùng của Cách Cục Sát Phá Lang, sao Dịch Mã trong lá số cực vượng, một đời luôn thay đổi ranh giới tương lai của nhân loại',
    notableEn: 'An intense expression of the Sha Po Lang pattern, with a powerful Travel Horse star and a life devoted to pushing the boundaries of humanity’s future.',
  },

  // ─── 体育明星 ─────────────────────────────────────────────
  {
    id: 'yao-ming',
    name: '姚明',
    nameEn: 'Yao Ming',
    category: '体育',
    description: 'Trung phong huyền thoại NBA, gương mặt đại diện của bóng rổ Trung Quốc',
    descriptionEn: 'Legendary NBA center and ambassador for Chinese basketball',
    year: 1980, month: 9, day: 12, hour: 5,  // 巳时
    gender: 'male',
    notable: 'Thiên Lương thủ Mệnh, cao lớn uy nghiêm, tinh tượng tại Cung Quan Lộc trùng khớp cao độ với thành tựu sự nghiệp của anh',
    notableEn: 'Tian Liang guarding the Life Palace suggests stature and dignity, while the Career Palace closely aligns with his professional achievements.',
  },
  {
    id: 'li-na',
    name: '李娜',
    nameEn: 'Li Na',
    category: '体育',
    description: 'Nhà vô địch Grand Slam quần vợt của Trung Quốc',
    descriptionEn: 'Chinese Grand Slam tennis champion',
    year: 1982, month: 2, day: 26, hour: 2,  // 寅时
    gender: 'female',
    notable: 'Thất Sát hóa khí, trong mệnh định sẵn sự cạnh tranh với người đời, Đại Hạn và Lưu Niên tương ứng chuẩn xác với thời điểm đăng quang giải Pháp Mở rộng',
    notableEn: 'Qi Sha channels a powerful competitive drive, while the major periods and annual cycles closely align with the timing of her French Open victory.',
  },
];

/** 按分类获取名人 */
export function getFamousByCategory(category: FamousPerson['category']): FamousPerson[] {
  return FAMOUS_PERSONS.filter(p => p.category === category);
}

/** 获取所有分类 */
export const FAMOUS_CATEGORIES: FamousPerson['category'][] = [
  '商业', '文艺', '科技', '体育',
];
