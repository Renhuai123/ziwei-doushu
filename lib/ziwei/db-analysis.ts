/**
 * lib/ziwei/db-analysis —— Bản giữ chỗ mã nguồn mở (kho nội dung luận đoán không thuộc phạm vi mã nguồn mở)
 *
 * Phiên bản đầy đủ trực tuyến bao gồm luận đoán mệnh lý chi tiết của 14 chính tinh × 13 ngữ cảnh cung vị
 * (Định hướng một câu / Luận đoán cốt lõi / Căn cứ lá số / Xuất xứ cổ điển), thuộc về nội dung cốt lõi,
 * không mở mã nguồn cùng công cụ an sao. Tệp này chỉ giữ lại "kiểu dữ liệu + nhãn cung vị/chủ đề"
 * cần thiết cho khung trang tri thức SEO (thuật ngữ Tử Vi Đẩu Số thông dụng, không phải nội dung độc quyền),
 * kho nội dung luận đoán STAR_DB được để trống —— do đó trang chi tiết kho tri thức sẽ tạo ra 0 route tĩnh.
 *
 * Nhân lõi an sao (thuật toán an sao, tứ hóa, nhận diện cách cục, nguyên văn cổ tịch) hoàn toàn mở,
 * xem algorithm.ts / patterns.ts / sihua.ts trong thư mục lib/ziwei.
 */

export type TopicKey =
  | 'overview' | 'personality' | 'love' | 'career' | 'wealth' | 'health'
  | 'family' | 'children' | 'move' | 'friends' | 'home' | 'spirit' | 'parents';

// Tên cung vị iztro zh-CN: Cung Mệnh giữ chữ "宫" (Cung), các cung khác không có chữ "宫", "Giao hữu" trong iztro gọi là "Bộc dịch" (仆役)
export const TOPIC_PALACE_NAME: Record<TopicKey, string> = {
  overview:    '命宫',
  personality: '命宫',
  love:        '夫妻',
  career:      '官禄',
  wealth:      '财帛',
  health:      '疾厄',
  family:      '兄弟',
  children:    '子女',
  move:        '迁移',
  friends:     '仆役',
  home:        '田宅',
  spirit:      '福德',
  parents:     '父母',
};

export const TOPIC_LABEL: Record<TopicKey, string> = {
  overview:    'Tổng quan Mệnh cách',
  personality: 'Đặc điểm tính cách',
  love:        'Tình cảm hôn nhân',
  career:      'Sự nghiệp chức nghiệp',
  wealth:      'Vận thế tài lộc',
  health:      'Tình trạng sức khỏe',
  family:      'Huynh đệ hợp tác',
  children:    'Duyên phận con cái',
  move:        'Thiên di xuất hành',
  friends:     'Nhân tế quý nhân',
  home:        'Điền trạch bất động sản',
  spirit:      'Tinh thần phúc đức',
  parents:     'Phụ mẫu trưởng bối',
};

/**
 * Kho nội dung luận đoán (lời đoán chi tiết của 14 chính tinh × các ngữ cảnh cung vị) — nội dung cốt lõi, không nằm trong phạm vi mã nguồn mở.
 * Tại đây để trống; trang SEO kho tri thức do `exists=false` sẽ tạo 0 route chi tiết tĩnh, nhưng khung danh sách vẫn chạy bình thường.
 */
export const STAR_DB: Record<string, unknown> = {};
