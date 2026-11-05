/**
 * /library/[book]/[chapter] — Trang đọc từng chương cổ tịch
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getChapter } from '@/lib/classics';

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
  return ALL_BOOKS.flatMap(b =>
    b.chapters.map((_, i) => ({ book: b.slug, chapter: String(i) }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) return {};
  const bookTitle = bookTitleVi(result.book.title);
  return {
    title: `${result.chapter.title} · 《${bookTitle}》· Cổ Tịch Tử Vi Đẩu Số`,
    description: result.chapter.subtitle || `Nguyên văn ${result.chapter.title} - 《${bookTitle}》`,
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) notFound();

  const { book, chapter, chapterIdx } = result;
  const prevIdx = chapterIdx - 1;
  const nextIdx = chapterIdx + 1;

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href={`/library/${book.slug}`} style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← Mục lục 《{bookTitleVi(book.title)}》
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.15em' }}>
          {chapter.title}
        </div>
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          Kho Cổ Tịch →
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Tiêu đề chương */}
        <div className="text-center mb-10">
          <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.25em', marginBottom: '8px' }}>
            《{bookTitleVi(book.title)}》· {dynastyVi(book.dynasty)}
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '8px' }}>
            {chapter.title}
          </h1>
          {chapter.subtitle && (
            <div style={{ fontSize: '13px', color: 'var(--tx-2)', letterSpacing: '0.1em' }}>
              {chapter.subtitle}
            </div>
          )}
        </div>

        {/* Nội dung các đoạn văn */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid rgba(184,146,42,0.2)', padding: '32px 28px' }}>
          {chapter.paragraphs.map((p, i) => (
            <div
              key={p.id}
              id={p.id}
              style={{
                marginBottom: i === chapter.paragraphs.length - 1 ? 0 : '20px',
                paddingBottom: i === chapter.paragraphs.length - 1 ? 0 : '20px',
                borderBottom: i === chapter.paragraphs.length - 1 ? 'none' : '1px dashed rgba(184,146,42,0.15)',
                scrollMarginTop: '80px',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
              }}>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--ac)',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  minWidth: '24px',
                }}>
                  {String(p.idx).padStart(2, '0')}
                </span>
                <p style={{
                  flex: 1,
                  fontSize: '16px',
                  color: 'var(--tx-0)',
                  lineHeight: 2,
                  letterSpacing: '0.04em',
                  fontFamily: '"PingFang SC", "Hiragino Sans GB", serif',
                }}>
                  {p.text}
                </p>
              </div>
              {p.translation && (
                <div style={{
                  marginTop: '8px',
                  marginLeft: '36px',
                  padding: '8px 12px',
                  background: 'rgba(184,146,42,0.05)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--tx-2)',
                  lineHeight: 1.8,
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--ac)', marginRight: '6px' }}>Dịch nghĩa</span>
                  {p.translation}
                </div>
              )}
              {p.niNote && (
                <div style={{
                  marginTop: '8px',
                  marginLeft: '36px',
                  padding: '8px 12px',
                  background: 'rgba(196,90,45,0.05)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--tx-2)',
                  lineHeight: 1.8,
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--ji)', marginRight: '6px' }}>Thầy Nghê chú giải</span>
                  {p.niNote}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Điều hướng chuyển chương */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          {prevIdx >= 0 ? (
            <Link
              href={`/library/${book.slug}/${prevIdx}`}
              style={{
                flex: 1,
                padding: '14px 18px',
                background: 'var(--bg-card)',
                border: '1px solid rgba(184,146,42,0.2)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'var(--tx-0)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.2em', marginBottom: '2px' }}>← Chương trước</div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{book.chapters[prevIdx].title}</div>
            </Link>
          ) : <div style={{ flex: 1 }} />}
          {nextIdx < book.chapters.length ? (
            <Link
              href={`/library/${book.slug}/${nextIdx}`}
              style={{
                flex: 1,
                padding: '14px 18px',
                background: 'var(--bg-card)',
                border: '1px solid rgba(184,146,42,0.2)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'var(--tx-0)',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.2em', marginBottom: '2px' }}>Chương sau →</div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{book.chapters[nextIdx].title}</div>
            </Link>
          ) : <div style={{ flex: 1 }} />}
        </div>
      </article>
    </div>
  );
}
