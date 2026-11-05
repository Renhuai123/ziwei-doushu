/**
 * Thư viện tra cứu nguyên điển cổ tịch — Định nghĩa kiểu dữ liệu (Types)
 *
 * Thiết kế: Toàn bộ cổ tịch được đóng gói dưới dạng dữ liệu tĩnh JSON vào mã nguồn (bản công cộng không rủi ro bản quyền)
 * Tải một lần vào bộ nhớ khi Next.js khởi động, không phụ thuộc cơ sở dữ liệu (zero DB dependency)
 */

export interface Paragraph {
  /** ID duy nhất của đoạn văn (dùng để chuyển hướng mỏ neo) */
  id: string;
  /** Thứ tự đoạn văn (trong chương) */
  idx: number;
  /** Nguyên văn đoạn văn (cổ văn) */
  text: string;
  /** Bản dịch hiện đại (tùy chọn, sẽ bổ sung sau) */
  translation?: string;
  /** Chú giải của thầy Nghê (tùy chọn, ghi rõ nguồn) */
  niNote?: string;
}

export interface Chapter {
  /** Tiêu đề chương (ví dụ: "Quyển 1", "Tổng luận thiên") */
  title: string;
  /** Phụ đề / Giới thiệu sơ lược chương (tùy chọn) */
  subtitle?: string;
  paragraphs: Paragraph[];
}

export interface Book {
  /** Tên sách */
  title: string;
  /** Slug của sách (dùng cho URL, ví dụ: 'guisuifu') */
  slug: string;
  /** Triều đại */
  dynasty: string;
  /** Tác giả (nhiều người hoặc khuyết danh thì điền "Khuyết danh" hoặc nhiều người) */
  author: string;
  /** Giới thiệu tóm tắt */
  intro: string;
  /** Tổng số chữ (ước lượng) */
  wordCount: number;
  chapters: Chapter[];
}

export interface SearchHit {
  bookSlug: string;
  bookTitle: string;
  chapterTitle: string;
  paragraphId: string;
  /** Đoạn trích nổi bật (chứa thẻ <mark>) */
  snippet: string;
  /** Nguyên văn */
  text: string;
}
