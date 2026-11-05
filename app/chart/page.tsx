'use client';
import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import TimeNav, { type TimeView } from '@/components/TimeNav';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/**
 * Trang lá số —— Bản mã nguồn mở「Demo Bộ máy lập lá số」
 *
 * Đây là một ví dụ tối thiểu có thể chạy: sử dụng bộ máy lập lá số generateChart() của
 * kho lưu trữ này kết hợp với các component UI cơ bản, hiển thị một lá số Tử Vi hoàn chỉnh
 * kèm luận giải cơ bản, đồng thời hỗ trợ chuyển đổi Bản Mệnh / Đại Hạn / Lưu Niên.
 *
 * Lưu ý: Giao diện tương tác hoàn chỉnh của phiên bản thương mại trực tuyến (UI thiết kế mới,
 * luận giải AI dạng stream, hợp mệnh, thẻ chia sẻ, v.v.) không nằm trong phạm vi mã nguồn mở;
 * tuy nhiên phần lõi lập lá số —— thuật toán an sao, tứ hóa, nhận diện cách cục, kho cổ thư ——
 * hoàn toàn mở (xem lib/ziwei/*), bạn có thể tự do phát triển giao diện của riêng mình.
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(() => new Date().getFullYear());

  // ── Chưa lập lá số: hiển thị form nhập thông tin sinh ──
  if (!chart) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Lập lá số Tử Vi Đẩu Số</h1>
        <p style={{ color: '#888', marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>
          Nhập năm, tháng, ngày, giờ sinh — bộ máy lập lá số mã nguồn mở sẽ tạo lá số ngay lập tức.
          <br />
          (Trang này là bản demo bộ máy lập lá số, giao diện bản thương mại đầy đủ không thuộc phạm vi mã nguồn mở; nhân lập lá số hoàn toàn mở.)
        </p>
        <BirthForm onSubmit={(info: BirthInfo) => setChart(generateChart(info))} />
      </main>
    );
  }

  // ── Đã lập lá số: hiển thị lá số + luận giải ──
  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
      <button
        type="button"
        onClick={() => { setChart(null); setSelectedPalace(null); }}
        style={{
          marginBottom: 16, padding: '6px 14px', cursor: 'pointer',
          border: '1px solid #ccc', borderRadius: 8, background: 'transparent',
        }}
      >
        ← Lập lại lá số
      </button>

      <TimeNav
        chart={chart}
        view={view}
        liunianYear={liunianYear}
        onViewChange={setView}
        onYearChange={setLiunianYear}
      />

      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]"
        style={{
          gap: 20, marginTop: 16, alignItems: 'start',
        }}
      >
        <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
        <InsightPanel chart={chart} selectedPalace={selectedPalace} />
      </div>
    </main>
  );
}
