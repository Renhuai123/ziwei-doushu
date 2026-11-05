/**
 * /knowledge — Trang chủ kho kiến thức
 * Liệt kê 14 chính tinh, mỗi sao có thể xem luận giải tại 13 cung vị
 */

import Link from 'next/link';
import { ALL_STARS, ALL_TOPICS, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { TOPIC_LABEL } from '@/lib/ziwei/db-analysis';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import { starName, paName } from '@/lib/ziwei/display-vi';

export const metadata = {
  title: 'Kho Kiến Thức Tử Vi Đẩu Số · 14 Chính Tinh × 13 Cung Vị · Hệ Thống Chính Tông Nghê Hải Hạ',
  description: 'Kho kiến thức Tử Vi Đẩu Số được biên soạn dựa trên hệ thống "Thiên Kỷ" của thầy Nghê Hải Hạ cùng các cổ tịch "Tử Vi Đẩu Số Toàn Tập", "Cốt Tủy Phú". Bao quát đầy đủ luận đoán cho 14 chính tinh tại 13 cung vị, bao gồm định tính trong một câu, luận đoán cốt lõi, căn cứ lá số, xuất xứ kinh điển.',
  keywords: ['Tử Vi Đẩu Số', 'Nghê Hải Hạ', 'Tử Vi Đẩu Số Nghê Hải Hạ', 'Tử Vi Đẩu Số Toàn Tập', 'Tử Vi Đẩu Số Toàn Thư', '14 chính tinh', '12 cung vị'],
};

const TOPIC_LABEL_VI: Record<TopicKey, string> = {
  overview:    'Tổng quan Mệnh cách',
  personality: 'Đặc điểm tính cách',
  love:        'Tình cảm hôn nhân',
  career:      'Sự nghiệp công danh',
  wealth:      'Vận thế tài lộc',
  health:      'Tình trạng sức khỏe',
  family:      'Huynh đệ hợp tác',
  children:    'Duyên phận con cái',
  move:        'Thiên di xuất hành',
  friends:     'Giao tế quý nhân',
  home:        'Điền trạch bất động sản',
  spirit:      'Tinh thần phúc đức',
  parents:     'Phụ mẫu trưởng bối',
};

export default function KnowledgeHomePage() {
  const STAR_DESCRIPTIONS_QUICK = STAR_BRIEF_SEO;

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Thanh điều hướng trên */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← Trang chủ
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
          Phương pháp luận thầy Nghê · Kho kiến thức
        </div>
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          Cổ tịch →
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center px-6 py-14">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(184,146,42,0.4))' }} />
          <span style={{ fontSize: '11px', color: 'var(--ac)', letterSpacing: '0.4em' }}>KNOWLEDGE BASE</span>
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(184,146,42,0.4))' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '12px' }}>
          Kho kiến thức Tử Vi Đẩu Số
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.08em', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
          14 chính tinh × 13 cung vị = <strong style={{ color: 'var(--ac)' }}>{ALL_STARS.length * ALL_TOPICS.length}</strong> chuyên đề<br />
          Biên soạn dựa trên hệ thống "Thiên Kỷ" của thầy Nghê Hải Hạ · Kèm trích dẫn cổ tịch
        </p>
      </div>

      {/* Thẻ 14 chính tinh */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.3em', textAlign: 'center', marginBottom: '24px' }}>
          14 CHÍNH TINH
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_STARS.map(star => (
            <Link
              key={star}
              href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}
              style={{
                display: 'block',
                padding: '14px 10px',
                background: 'var(--bg-card)',
                border: '1px solid rgba(184,146,42,0.2)',
                borderRadius: '10px',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
              className="hover:shadow-md hover:border-amber-400"
            >
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em' }}>
                {starName(star)}
              </div>
            </Link>
          ))}
        </div>

        {/* Danh sách chi tiết (từng chính tinh + tóm tắt sơ lược + liên kết chuyển tiếp) */}
        <div className="mt-14 space-y-4">
          {ALL_STARS.map(star => (
            <div key={star} style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(184,146,42,0.18)',
              borderRadius: '12px',
              padding: '18px 22px',
            }}>
              <div className="flex items-baseline gap-3 mb-2">
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
                  Sao {starName(star)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.15em' }}>
                  TỬ VI · 14 CHÍNH TINH
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '12px' }}>
                {STAR_DESCRIPTIONS_QUICK[star] || ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOPICS.map(t => {
                  const k = getKnowledge(star, t);
                  if (!k.exists) return null;
                  return (
                    <Link
                      key={t}
                      href={`/knowledge/${STAR_TO_SLUG[star]}/${t}`}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        background: 'rgba(184,146,42,0.06)',
                        border: '1px solid rgba(184,146,42,0.15)',
                        borderRadius: '999px',
                        color: 'var(--tx-2)',
                        textDecoration: 'none',
                      }}
                    >
                      Nhập {paName(k.palaceName)} · {TOPIC_LABEL_VI[t] ?? TOPIC_LABEL[t]}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
