export const metadata = { title: 'Điều khoản sử dụng · Lá số Tử Vi', description: 'Điều khoản dịch vụ và thỏa thuận người dùng Lá số Tử Vi' };

export default function TermsPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>Về trang chủ</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>Lá số Tử Vi</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Điều khoản sử dụng</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Cập nhật lần cuối: tháng 4/2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. Tổng quan dịch vụ</h2>
      <p>Lá số Tử Vi (sau đây gọi là “nền tảng”) cung cấp dịch vụ lập và luận giải lá số theo hệ thống Tử Vi Đẩu Số trong Thiên Kỷ của Nghê Hải Hạ. Mọi nội dung mệnh lý chỉ để tham khảo,<strong>không thay thế tư vấn y tế, đầu tư, pháp lý, tâm lý hoặc lời khuyên cho các quyết định quan trọng trong cuộc sống</strong>。</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. Quy tắc sử dụng</h2>
      <p>Khi sử dụng nền tảng, bạn đồng ý:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Chỉ sử dụng vì mục đích hợp pháp và tham khảo cá nhân</li>
        <li>Không phát tán nội dung của nền tảng để bán thương mại, đăng lại hoặc công bố công khai</li>
        <li>Không thực hiện hành vi gây gián đoạn hoạt động bình thường của nền tảng</li>
        <li>Cung cấp thông tin sinh chính xác; nền tảng không chịu trách nhiệm về sai lệch luận giải do thông tin đầu vào không đúng</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. Sở hữu trí tuệ và hạn chế thu thập dữ liệu, huấn luyện mô hình</h2>
      <p style={{ background: 'rgba(168,50,40,0.06)', border: '1px solid rgba(168,50,40,0.2)', padding: 16, borderRadius: 8 }}>
        <strong>Toàn bộ nội dung mệnh lý, kho kiến thức (bao gồm văn bản luận giải 14 chính tinh × 12 cung × nam nữ × Tứ Hóa × đại hạn, lưu niên), thiết kế giao diện, phương án tích hợp thuật toán và kho trường hợp được nền tảng sáng tạo hoặc tổng hợp hợp pháp.</strong><br/><br/>
        Các hành vi dưới đây bị nghiêm cấm; nền tảng bảo lưu quyền yêu cầu bồi thường dân sự và xem xét trách nhiệm hình sự đối với vi phạm:<br/>
        ① Thu thập nội dung bằng trình thu thập dữ liệu, script tự động, gọi API hàng loạt hoặc các biện pháp kỹ thuật khác;<br/>
        ② Dùng luận giải, văn bản hoặc dữ liệu phản hồi API do nền tảng tạo ra để huấn luyện mô hình học máy, bao gồm mô hình ngôn ngữ lớn, mô hình sinh nội dung mệnh lý hoặc văn bản;<br/>
        ③ Bán lại hoặc đăng nội dung do nền tảng tạo ra lên website, ứng dụng hay tài khoản truyền thông khác;<br/>
        ④ Dịch ngược, sao chép hoặc sửa mã frontend, backend để tự cung cấp dịch vụ tương tự.<br/><br/>
        Văn bản đầu ra có dấu vết nhận dạng nhằm truy xuất nguồn; đầu ra từ hoạt động sao chép hoặc huấn luyện trái phép có thể được phát hiện và truy vết. Khi phát hiện vi phạm, nền tảng có quyền yêu cầu <strong>bồi thường 1 triệu nhân dân tệ cho mỗi trường hợp vi phạm</strong>, đồng thời bảo lưu quyền khởi kiện và phối hợp điều tra với cơ quan công an.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. Miễn trừ trách nhiệm</h2>
      <p>Nội dung được tổng hợp từ Tử Vi Đẩu Số truyền thống và hệ thống Nghê Hải Hạ,<strong>không bảo đảm chính xác 100%</strong>. Theo quan niệm Thiên–Địa–Nhân, nội dung chỉ là góc nhìn để tìm hiểu bản thân. Người dùng cần xem xét hợp lý và không phụ thuộc quá mức vào một nhận định mệnh lý duy nhất.</p>
      <p>Nền tảng không chịu trách nhiệm pháp lý về hậu quả phát sinh từ việc sử dụng nội dung, bao gồm quyết định sai, ảnh hưởng tâm lý hoặc thay đổi quan hệ.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Thay đổi và chấm dứt dịch vụ</h2>
      <p>Nền tảng bảo lưu quyền điều chỉnh, tạm dừng hoặc chấm dứt một phần hay toàn bộ dịch vụ. Thay đổi quan trọng sẽ được thông báo trên website hoặc qua email.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Luật áp dụng và giải quyết tranh chấp</h2>
      <p>Điều khoản này áp dụng pháp luật Cộng hòa Nhân dân Trung Hoa. Tranh chấp trước hết được thương lượng; nếu không đạt thỏa thuận, vụ việc được đưa ra tòa án nhân dân có thẩm quyền tại nơi đặt đơn vị vận hành nền tảng.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. Liên hệ</h2>
      <p>Nếu có thắc mắc, vui lòng liên hệ qua WeChat hỗ trợ hoặc email được nền tảng công bố.</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/privacy" style={{ color: 'var(--ac)' }}>Chính sách riêng tư</a> · <a href="/" style={{ color: 'var(--ac)' }}>Về trang chủ</a>
        </p>
      </main>
    </>
  );
}
