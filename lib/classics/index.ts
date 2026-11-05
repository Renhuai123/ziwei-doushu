/**
 * Thư viện tra cứu nguyên điển cổ tịch — Điểm khởi đầu (Entry)
 *
 * Tải toàn bộ dữ liệu cổ tịch + Cung cấp API truy vấn / tìm kiếm
 * Dữ liệu đóng gói tĩnh JSON, không phụ thuộc cơ sở dữ liệu, không tạo yêu cầu mạng
 */

import type { Book, Paragraph, SearchHit } from './types';
import { guSuiFu } from './data/gusuifu';
import { ziWeiQuanJi } from './data/quanji';
import { ziWeiQuanShu } from './data/quanshu';

/** Toàn bộ cổ tịch đã được thu thập */
export const ALL_BOOKS: Book[] = [
  guSuiFu,
  ziWeiQuanJi,
  ziWeiQuanShu,
];

/** Tổng số đoạn văn (dùng cho thống kê trang chủ) */
export const TOTAL_PARAGRAPHS = ALL_BOOKS.reduce(
  (sum, b) => sum + b.chapters.reduce((s, c) => s + c.paragraphs.length, 0),
  0,
);

/** Lấy thông tin sách theo slug */
export function getBookBySlug(slug: string): Book | null {
  return ALL_BOOKS.find(b => b.slug === slug) ?? null;
}

/** Lấy chương theo số thứ tự chương trong sách */
export function getChapter(bookSlug: string, chapterIdx: number) {
  const book = getBookBySlug(bookSlug);
  if (!book) return null;
  const chapter = book.chapters[chapterIdx];
  if (!chapter) return null;
  return { book, chapter, chapterIdx };
}

/** Lấy đoạn văn theo ID đoạn (kèm thông tin sách và chương tương ứng) */
export function getParagraphById(id: string) {
  for (const book of ALL_BOOKS) {
    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];
      const p = ch.paragraphs.find(p => p.id === id);
      if (p) {
        return { book, chapter: ch, chapterIdx: i, paragraph: p };
      }
    }
  }
  return null;
}

/**
 * Tìm kiếm toàn văn
 *
 * Khớp chuỗi con đơn giản (không tách từ, phù hợp với Hán văn/tiếng Trung)
 * Không phân biệt chữ hoa chữ thường, hiện chưa hỗ trợ chuyển đổi giản - phồn thể
 */
export function searchClassics(query: string, limit = 30): SearchHit[] {
  const q = query.trim();
  if (q.length < 1) return [];

  const hits: SearchHit[] = [];
  for (const book of ALL_BOOKS) {
    for (const chapter of book.chapters) {
      for (const p of chapter.paragraphs) {
        const idx = p.text.indexOf(q);
        if (idx < 0) continue;

        // Trích xuất ngữ cảnh (trước và sau mỗi bên 40 ký tự)
        const start = Math.max(0, idx - 40);
        const end = Math.min(p.text.length, idx + q.length + 40);
        const before = p.text.slice(start, idx);
        const matched = p.text.slice(idx, idx + q.length);
        const after = p.text.slice(idx + q.length, end);

        const snippet = (start > 0 ? '…' : '')
          + escapeHtml(before)
          + `<mark>${escapeHtml(matched)}</mark>`
          + escapeHtml(after)
          + (end < p.text.length ? '…' : '');

        hits.push({
          bookSlug: book.slug,
          bookTitle: book.title,
          chapterTitle: chapter.title,
          paragraphId: p.id,
          snippet,
          text: p.text,
        });

        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type { Book, Chapter, Paragraph, SearchHit } from './types';
