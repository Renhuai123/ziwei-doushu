/**
 * /library — kho cổ tịch
 *
 * Metadata (SEO) ở server component; nội dung hiển thị trong LibraryHomeView
 * để dùng useLanguage() và đổi ngôn ngữ phía client.
 */

import LibraryHomeView from './LibraryHomeView';

export const metadata = {
  title: 'Phương pháp luận Nghê sư · Kho cổ tịch Tử Vi Đẩu Số — Toàn Tập / Toàn Thư / Cốt Tủy Phú',
  description:
    'Tra cứu toàn văn cổ tịch Tử Vi Đẩu Số: Tử Vi Đẩu Số Toàn Tập, Tử Vi Đẩu Số Toàn Thư, Cốt Tủy Phú — nguồn dẫn chứng của hệ Thiên Kỷ Nghê Hải Hạ.',
};

export default function LibraryHomePage() {
  return <LibraryHomeView />;
}
