'use client';
import { viTerm } from '@/lib/i18n/vi';
import { motion } from 'framer-motion';
import type { FamousPerson } from '@/lib/ziwei/famous';

const CATEGORY_COLORS: Record<string, string> = {
  '商业': '#4ade80',
  '文艺': '#c084fc',
  '科技': '#60a5fa',
  '体育': '#fb923c',
  '历史': '#facc15',
};

export default function FamousPersonCard({ person }: { person: FamousPerson }) {
  const catColor = CATEGORY_COLORS[person.category] ?? '#d4a843';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="card-glass rounded-xl p-4 mb-4"
      style={{
        border: `1px solid ${catColor}40`,
        background: `linear-gradient(135deg, ${catColor}06, transparent 60%)`,
      }}
    >
      <div className="text-[10px] tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--t-faint)' }}>
        <span style={{ color: catColor, opacity: 0.9, fontSize: '12px' }}>★</span>
        Lá số danh nhân
        <span className="text-[9px] px-2 py-0.5 rounded-full ml-auto"
          style={{ color: catColor, background: catColor + '18', border: `1px solid ${catColor}40` }}>
          {viTerm(person.category)}
        </span>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-base font-semibold" style={{ color: 'var(--t-text1)', letterSpacing: '0.02em' }}>
            {viTerm(person.name)}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--t-faint)' }}>
            {person.year} · {person.gender === 'male' ? 'Nam mệnh' : 'Nữ mệnh'}
          </span>
        </div>

        <div className="text-[11px]" style={{ color: 'var(--t-text2)', opacity: 0.85 }}>
          {viTerm(person.description)}
        </div>

        <div className="text-[11px] leading-relaxed px-3 py-2.5 rounded-md"
          style={{
            color: 'var(--t-text2)',
            background: catColor + '0c',
            border: `1px solid ${catColor}25`,
          }}>
          <span style={{ color: catColor, fontWeight: 600, marginRight: '4px' }}>Điểm nổi bật: </span>
          {viTerm(person.notable)}
        </div>

        <div className="text-[10px] mt-2" style={{ color: 'var(--t-faint)', opacity: 0.6, lineHeight: 1.5 }}>
          ⚠️ Giờ sinh được ước tính từ tư liệu công khai, chỉ dùng tham khảo nghiên cứu. Phần luận giải AI được tạo từ lá số này, không đại diện cho người thật.
        </div>
      </div>
    </motion.div>
  );
}
