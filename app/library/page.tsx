/**
 * Kho tra cứu cổ tịch nguyên điển · Trang chủ
 *
 * Danh sách toàn bộ cổ tịch thu thập + Cổng tìm kiếm toàn văn
 */

import Link from 'next/link';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import LibrarySearch from './LibrarySearch';

const BOOK_NAME_VI: Record<string, string> = {
  '紫微斗数全书': 'Tử Vi Đẩu Số Toàn Thư',
  '紫微斗数全集': 'Tử Vi Đẩu Số Toàn Tập',
  '骨髓赋': 'Cốt Tủy Phú',
  '天纪': 'Thiên Kỷ',
  '太微赋': 'Thái Vi Phú',
  '形性赋': 'Hình Tính Phú',
  '诸星问答论': 'Chư Tinh Vấn Đáp Luận',
  '斗数捷径': 'Đẩu Số Tiệp Kính',
  '增补紫微斗数全书': 'Tăng Bổ Tử Vi Đẩu Số Toàn Thư',
  '十八飞星策天胴胆经': 'Thập Bát Phi Tinh Sách Thiên Đống Đảm Kinh',
};

const BOOK_TITLE_VI: Record<string, string> = BOOK_NAME_VI;

function bookTitleVi(title: string): string {
  return BOOK_NAME_VI[title] ?? title;
}

const DYNASTY_VI: Record<string, string> = {
  '明代': 'Thời Minh',
  '明': 'Thời Minh',
  '明朝': 'Thời Minh',
  '宋代': 'Thời Tống',
  '宋': 'Thời Tống',
  '宋朝': 'Thời Tống',
  '清代': 'Thời Thanh',
  '清': 'Thời Thanh',
  '清朝': 'Thời Thanh',
  '唐代': 'Thời Đường',
  '唐': 'Thời Đường',
  '唐朝': 'Thời Đường',
  '汉代': 'Thời Hán',
  '汉': 'Thời Hán',
  '汉朝': 'Thời Hán',
  '元代': 'Thời Nguyên',
  '元': 'Thời Nguyên',
  '元朝': 'Thời Nguyên',
  '周代': 'Thời Chu',
  '周': 'Thời Chu',
  '周朝': 'Thời Chu',
  '现代': 'Thời Hiện Đại',
};

function dynastyVi(dynasty: string): string {
  return DYNASTY_VI[dynasty] ?? dynasty;
}

function authorShortVi(book: { slug: string; author: string }): string {
  if (book.slug === 'gusuifu') return 'Khuyết danh';
  if (book.slug === 'quanji') return 'Tổ sư Trần Đoàn';
  if (book.slug === 'quanshu') return 'La Hồng Tiên';
  return book.author.replace(/^(Tương truyền do |Cổ tịch Tử Vi Đẩu Số truyền lại |Tương truyền: )/, '').replace(/\s*biên soạn$/, '');
}

export const metadata = {
  title: 'Phương Pháp Luận Nghê Sư · Kho Cổ Tịch Nguyên Điển · Tử Vi Đẩu Số Toàn Tập / Toàn Thư / Cốt Tủy Phú',
  description: 'Tra cứu toàn văn cổ tịch Tử Vi Đẩu Số uy tín: 《Tử Vi Đẩu Số Toàn Tập》《Tử Vi Đẩu Số Toàn Thư》《Cốt Tủy Phú》, nguồn dẫn chứng 《Thiên Kỷ》 của Nghê Hải Hạ',
};

export default function LibraryHomePage() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Thanh điều hướng trên */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← Về trang chủ
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.3em' }}>
          KHO CỔ TỊCH NGUYÊN ĐIỂN · CLASSICS
        </div>
        <Link href="/chart" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          Lập lá số →
        </Link>
      </div>

      {/* Hero giới thiệu */}
      <div className="text-center px-6 py-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(184,146,42,0.4))' }} />
          <span style={{ fontSize: '11px', color: 'var(--ac)', letterSpacing: '0.4em' }}>NGHÊ HẢI HẠ · HỆ THỐNG THIÊN KỶ</span>
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(184,146,42,0.4))' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '12px' }}>
          Phương Pháp Luận Nghê Sư · Kho Cổ Tịch Nguyên Điển
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.1em', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
          Tra cứu toàn văn cổ tịch Tử Vi Đẩu Số uy tín<br />
          Thu thập <strong style={{ color: 'var(--ac)' }}>{ALL_BOOKS.length}</strong> bộ cổ tịch · Tổng cộng <strong style={{ color: 'var(--ac)' }}>{TOTAL_PARAGRAPHS}</strong> đoạn tinh hoa
        </p>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="max-w-2xl mx-auto px-6 mb-12">
        <LibrarySearch />
      </div>

      {/* Danh sách cổ tịch */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_BOOKS.map(book => (
            <Link
              key={book.slug}
              href={`/library/${book.slug}`}
              style={{
                display: 'block',
                background: 'var(--bg-card)',
                border: '1px solid rgba(184,146,42,0.2)',
                borderRadius: '14px',
                padding: '24px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(184,146,42,0.06)',
              }}
              className="hover:shadow-lg"
            >
              <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.2em', marginBottom: '6px' }}>
                {dynastyVi(book.dynasty)} · {authorShortVi(book)}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px', letterSpacing: '0.1em' }}>
                《{bookTitleVi(book.title)}》
              </div>
              <div style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '14px' }}>
                {book.intro}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--tx-3)' }}>
                <span>{book.chapters.length} chương</span>
                <span style={{ color: 'rgba(184,146,42,0.4)' }}>·</span>
                <span>{book.chapters.reduce((s, c) => s + c.paragraphs.length, 0)} đoạn tinh hoa</span>
              </div>
              <div style={{
                display: 'inline-flex',
                marginTop: '14px',
                fontSize: '11px',
                color: 'var(--ac)',
                letterSpacing: '0.15em',
                fontWeight: 500,
              }}>
                Vào tra cứu →
              </div>
            </Link>
          ))}
        </div>

        {/* Phần thuyết minh dưới trang */}
        <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(184,146,42,0.05)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--ac-dim)', fontWeight: 600, letterSpacing: '0.15em', marginBottom: '8px' }}>
            Về kho cổ tịch
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
            Các bộ cổ tịch thu thập tại đây đều thuộc phạm vi công cộng (bản in thời nhà Minh).<br />
            Nội dung đang tiếp tục hoàn thiện, trong tương lai sẽ bổ sung toàn văn 《Tử Vi Đẩu Số Toàn Tập》 và mục lục dẫn chứng 《Thiên Kỷ》 của Nghê Hải Hạ.<br />
            Nếu phát hiện bất kỳ sai sót nào, xin vui lòng liên hệ với chúng tôi.
          </div>
        </div>
      </div>
    </div>
  );
}
