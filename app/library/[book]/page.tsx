/**
 * /library/[book] — Trang mục lục từng bộ cổ tịch
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getBookBySlug } from '@/lib/classics';

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

const BOOK_TITLES_VI: Record<string, string> = BOOK_NAME_VI;

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

function bookTitleVi(title: string): string {
  return BOOK_NAME_VI[title] ?? title;
}

function dynastyVi(dynasty: string): string {
  return DYNASTY_VI[dynasty] ?? dynasty;
}

export async function generateStaticParams() {
  return ALL_BOOKS.map(b => ({ book: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return {};
  const title = bookTitleVi(book.title);
  const dynasty = dynastyVi(book.dynasty);
  return {
    title: `《${title}》· ${dynasty} · Kho Cổ Tịch Tử Vi Đẩu Số`,
    description: book.intro,
  };
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← Kho Cổ Tịch
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
          《{bookTitleVi(book.title)}》
        </div>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          Trang chủ →
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Thông tin sách */}
        <div className="text-center mb-12">
          <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.3em', marginBottom: '8px' }}>
            {dynastyVi(book.dynasty)} · {book.author}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '14px' }}>
            《{bookTitleVi(book.title)}》
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.8, maxWidth: '500px', margin: '0 auto' }}>
            {book.intro}
          </p>
        </div>

        {/* Mục lục các chương */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid rgba(184,146,42,0.2)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,146,42,0.15)', fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.3em' }}>
            MỤC LỤC CÁC CHƯƠNG · CHAPTERS
          </div>
          {book.chapters.map((chapter, i) => (
            <Link
              key={i}
              href={`/library/${book.slug}/${i}`}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '14px',
                padding: '14px 20px',
                borderBottom: i === book.chapters.length - 1 ? 'none' : '1px dashed rgba(184,146,42,0.15)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.15s',
              }}
              className="hover:bg-amber-50"
            >
              <div style={{ fontSize: '12px', color: 'var(--ac)', fontWeight: 600, minWidth: '40px', letterSpacing: '0.1em' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', color: 'var(--tx-0)', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '2px' }}>
                  {chapter.title}
                </div>
                {chapter.subtitle && (
                  <div style={{ fontSize: '11px', color: 'var(--tx-3)' }}>
                    {chapter.subtitle}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.1em' }}>
                {chapter.paragraphs.length} đoạn
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ac)' }}>→</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
