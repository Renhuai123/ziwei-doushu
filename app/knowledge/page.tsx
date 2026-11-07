/**
 * /knowledge — kho tri thức Tử Vi Đẩu Số
 *
 * Metadata (SEO) giữ ở server component, nội dung hiển thị nằm trong
 * KnowledgeHomeView để dùng được useLanguage() và đổi ngôn ngữ phía client.
 */

import KnowledgeHomeView from './KnowledgeHomeView';

export const metadata = {
  title: 'Kho tri thức Tử Vi Đẩu Số · 14 chính tinh × 13 cung vị · Hệ Nghê Hải Hạ',
  description:
    'Kho tri thức Tử Vi Đẩu Số biên soạn theo hệ Thiên Kỷ của Nghê Hải Hạ và cổ tịch Tử Vi Đẩu Số Toàn Tập, Cốt Tủy Phú: 14 chính tinh × 13 cung vị, gồm định điệu, luận điểm cốt lõi, căn cứ lá số và nguồn cổ tịch.',
  keywords: ['tử vi đẩu số', 'tử vi', 'nghê hải hạ', '14 chính tinh', '12 cung', 'cổ tịch tử vi'],
};

export default function KnowledgeHomePage() {
  return <KnowledgeHomeView />;
}
