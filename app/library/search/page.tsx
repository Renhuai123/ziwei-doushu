/**
 * /library/search?q=xxx — Trang kết quả tìm kiếm cổ tịch
 */

import Link from 'next/link';
import { searchClassics, getParagraphById } from '@/lib/classics';

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

export const metadata = {
  title: 'Tìm kiếm · Kho Cổ Tịch Nguyên Điển',
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const hits = q ? searchClassics(q, 50) : [];

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← Kho Cổ Tịch
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
          Kết quả tìm kiếm
        </div>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          Trang chủ →
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div style={{ fontSize: '13px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '4px' }}>
            Từ khóa tìm kiếm
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
            "{q || '(Trống)'}"
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--tx-3)', marginTop: '8px' }}>
            Tìm thấy <strong style={{ color: 'var(--ac)' }}>{hits.length}</strong> kết quả khớp trong nguyên văn cổ tịch
          </div>
        </div>

        {hits.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            padding: '40px 20px',
            borderRadius: '12px',
            textAlign: 'center',
            color: 'var(--tx-2)',
            border: '1px solid rgba(184,146,42,0.15)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>📜</div>
            {q ? (
              <>
                <div style={{ fontSize: '14px', marginBottom: '6px' }}>Tạm thời chưa tìm thấy từ khóa này trong các cổ tịch đã thu thập</div>
                <div style={{ fontSize: '11px', color: 'var(--tx-3)', lineHeight: 1.7 }}>
                  Chúng tôi đang tiếp tục bổ sung nội dung. Có thể thử tìm kiếm:<br />
                  <span style={{ color: 'var(--ac)' }}>Thất Sát Triều Đẩu / Song Lộc Triều Viên / Hóa Kỵ / Tử Vi / Cung Mệnh / Cơ Nguyệt Đồng Lương</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '13px' }}>Vui lòng nhập từ khóa cần tìm kiếm</div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hits.map((hit, i) => {
              const ctx = getParagraphById(hit.paragraphId);
              const chapterIdx = ctx?.chapterIdx ?? 0;
              return (
                <Link
                  key={i}
                  href={`/library/${hit.bookSlug}/${chapterIdx}#${hit.paragraphId}`}
                  style={{
                    display: 'block',
                    background: 'var(--bg-card)',
                    padding: '16px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(184,146,42,0.18)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: 'var(--tx-3)',
                    marginBottom: '8px',
                    letterSpacing: '0.1em',
                  }}>
                    <span style={{ color: 'var(--ac)', fontWeight: 600 }}>《{bookTitleVi(hit.bookTitle)}》</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span>{hit.chapterTitle}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--tx-0)',
                      lineHeight: 1.9,
                      letterSpacing: '0.02em',
                    }}
                    dangerouslySetInnerHTML={{ __html: hit.snippet }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        mark { background: rgba(184,146,42,0.3); color: #8b6a14; padding: 0 2px; border-radius: 2px; font-weight: 600; }
      `}</style>
    </div>
  );
}
