export const metadata = { title: 'Điều khoản dịch vụ · Lá Số Tử Vi', description: 'Điều khoản dịch vụ và thỏa thuận người dùng của Lá Số Tử Vi' };

export default function TermsPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>Về trang chủ</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>Lá Số Tử Vi</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Điều khoản dịch vụ</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Cập nhật lần cuối: tháng 4 năm 2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. Tổng quan dịch vụ</h2>
      <p>Lá Số Tử Vi (sau đây gọi là "nền tảng này") cung cấp dịch vụ lập lá số và luận giải dựa trên hệ thống Tử Vi Đẩu Số "Thiên Kỷ" của thầy Nghê Hải Hạ. Mọi nội dung luận mệnh trên nền tảng chỉ mang tính tham khảo, <strong>không cấu thành bất kỳ lời khuyên y tế, đầu tư, pháp lý, tư vấn tâm lý hay quyết định trọng đại nào trong đời sống</strong>.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. Quy tắc ứng xử của người dùng</h2>
      <p>Khi sử dụng nền tảng này, bạn đồng ý rằng:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Chỉ sử dụng nền tảng này cho mục đích hợp pháp, tham khảo cá nhân</li>
        <li>Không phát tán nội dung của nền tảng để bán, đăng lại hoặc công bố công khai vì mục đích thương mại</li>
        <li>Không thực hiện hành vi gây rối hoạt động bình thường của nền tảng</li>
        <li>Thông tin ngày sinh gửi lên là chính xác; nền tảng không chịu trách nhiệm về sai lệch luận giải do thông tin sai gây ra</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. Sở hữu trí tuệ và điều khoản cấm · Chống thu thập dữ liệu và chống huấn luyện AI</h2>
      <p style={{ background: 'rgba(168,50,40,0.06)', border: '1px solid rgba(168,50,40,0.2)', padding: 16, borderRadius: 8 }}>
        <strong>Toàn bộ nội dung luận mệnh, kho tri thức (bao gồm toàn bộ văn bản luận giải của 14 chính tinh × 12 cung × nam nữ × Tứ Hóa × Đại Hạn Lưu Niên), thiết kế UI, phương án tích hợp thuật toán, kho tình huống mẫu trên nền tảng này đều là sản phẩm gốc hoặc được biên soạn hợp pháp bởi nền tảng.</strong><br/><br/>
        Nghiêm cấm các hành vi sau đây, người vi phạm sẽ bị truy cứu trách nhiệm bồi thường dân sự và trách nhiệm hình sự:<br/>
        ① Sử dụng crawler, script tự động, gọi API hàng loạt hoặc bất kỳ biện pháp kỹ thuật nào khác để thu thập nội dung của nền tảng;<br/>
        ② Dùng luận giải lá số, văn bản, dữ liệu phản hồi API do nền tảng tạo ra <strong>để huấn luyện bất kỳ mô hình học máy nào</strong> (bao gồm nhưng không giới hạn ở mô hình ngôn ngữ lớn, mô hình sinh luận mệnh, mô hình sinh văn bản...);<br/>
        ③ Bán lại hoặc đăng nội dung do nền tảng tạo ra lên website, ứng dụng, tài khoản truyền thông khác;<br/>
        ④ Dịch ngược, sao chép, chỉnh sửa mã nguồn front-end hoặc back-end của nền tảng để tự cung cấp dịch vụ tương tự.<br/><br/>
        Văn bản đầu ra của nền tảng có nhúng watermark truy vết vân tay, đầu ra phát sinh từ việc sao chép/huấn luyện trái phép có thể bị phát hiện và truy vết. Khi phát hiện vi phạm, nền tảng có quyền yêu cầu <strong>bồi thường 1.000.000 Nhân dân tệ cho mỗi trường hợp vi phạm</strong>, và bảo lưu quyền khởi kiện ra tòa án cũng như phối hợp với cơ quan công an điều tra.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. Tuyên bố miễn trừ trách nhiệm</h2>
      <p>Nội dung luận mệnh trên nền tảng này được biên soạn dựa trên tri thức Tử Vi Đẩu Số truyền thống và hệ thống của thầy Nghê Hải Hạ, <strong>không đảm bảo chính xác 100%</strong>. Vận mệnh chịu ảnh hưởng đồng thời của ba yếu tố Thiên, Địa, Nhân; kết quả của nền tảng chỉ là tham khảo để nhận thức bản thân, người dùng nên nhìn nhận một cách lý trí, không nên phụ thuộc quá mức vào bất kỳ phán đoán luận mệnh đơn lẻ nào.</p>
      <p>Nền tảng không chịu trách nhiệm pháp lý đối với bất kỳ hậu quả nào phát sinh từ việc sử dụng nội dung của nền tảng (bao gồm nhưng không giới hạn ở sai lầm trong quyết định, ảnh hưởng tâm lý, thay đổi trong các mối quan hệ...).</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Thay đổi và chấm dứt dịch vụ</h2>
      <p>Nền tảng bảo lưu quyền điều chỉnh, tạm dừng hoặc chấm dứt một phần hoặc toàn bộ dịch vụ bất kỳ lúc nào. Các thay đổi quan trọng sẽ được thông báo cho người dùng qua thông báo trên trang hoặc email.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Luật áp dụng và giải quyết tranh chấp</h2>
      <p>Điều khoản này áp dụng theo pháp luật nước Cộng hòa Nhân dân Trung Hoa. Nếu phát sinh tranh chấp, hai bên nên thương lượng thiện chí; nếu không đạt được thỏa thuận, tranh chấp sẽ được đưa ra tòa án nhân dân có thẩm quyền tại nơi đặt trụ sở vận hành của nền tảng để giải quyết.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. Thông tin liên hệ</h2>
      <p>Nếu có thắc mắc, vui lòng liên hệ qua kênh hỗ trợ (WeChat / email) được công bố trên nền tảng.</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/privacy" style={{ color: 'var(--ac)' }}>Chính sách bảo mật</a> · <a href="/" style={{ color: 'var(--ac)' }}>Về trang chủ</a>
        </p>
      </main>
    </>
  );
}
