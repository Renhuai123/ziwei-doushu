export const metadata = { title: 'Chính sách bảo mật · Lá Số Tử Vi', description: 'Chính sách bảo mật của Lá Số Tử Vi' };

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Chính sách bảo mật</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Cập nhật lần cuối: tháng 4 năm 2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. Thông tin chúng tôi thu thập</h2>
      <p>Để cung cấp dịch vụ lập lá số và luận giải Lá Số Tử Vi, chúng tôi có thể thu thập các thông tin sau:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Thông tin cần thiết để lập lá số</strong>: Họ tên (tùy chọn), ngày tháng năm sinh dương lịch, giờ sinh, giới tính, kinh độ nơi sinh</li>
        <li><strong>Thông tin tài khoản (sau khi đăng ký)</strong>: Số điện thoại (dùng cho xác thực qua tin nhắn SMS và dịch vụ hội viên)</li>
        <li><strong>Thông tin tương tác</strong>: Lịch sử nhấp chuột, duyệt trang, lịch sử lá số của bạn trên hệ thống</li>
        <li><strong>Thông tin phản hồi</strong>: Đánh giá "chuẩn / không chuẩn" và phản hồi bằng văn bản của bạn đối với nội dung luận giải</li>
        <li><strong>Thông tin thanh toán</strong>: Khi mua quyền hội viên hoặc dịch vụ đơn lẻ, giao dịch được xử lý thông qua bên thanh toán thứ ba (Alipay / WeChat Pay), nền tảng này không lưu trữ đầy đủ số thẻ hoặc mật khẩu</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. Cách chúng tôi sử dụng thông tin</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>Thông tin lá số chỉ dùng cho lần luận giải này và lưu trữ trong lịch sử lá số thuộc tài khoản của bạn</li>
        <li>Số điện thoại dùng để đăng ký, đăng nhập và thông báo đơn hàng</li>
        <li>Thông tin phản hồi dùng để liên tục cải thiện chất lượng nội dung mệnh lý (phân tích tổng hợp sau khi đã ẩn danh hóa)</li>
        <li>Dữ liệu tổng hợp có thể được dùng cho nghiên cứu ngành và tối ưu hóa nền tảng</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. Chia sẻ thông tin và bên thứ ba</h2>
      <p>Ngoại trừ các trường hợp sau đây, chúng tôi sẽ không chia sẻ thông tin cá nhân của bạn với bất kỳ bên thứ ba nào:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Nhà cung cấp dịch vụ thanh toán (Alipay / WeChat Pay): Xử lý thanh toán đơn hàng</li>
        <li>Nhà cung cấp dịch vụ tin nhắn SMS (như Alibaba Cloud SMS): Gửi mã xác nhận</li>
        <li>Nhà cung cấp dịch vụ đám mây (như Vercel / Cloudflare / Alibaba Cloud): Hỗ trợ hạ tầng kỹ thuật</li>
        <li>Dịch vụ AI luận giải (như Anthropic Claude): Xử lý các cuộc đối thoại "hỏi thêm tự do" của bạn (đã được ẩn danh hóa)</li>
        <li>Cơ quan tư pháp hoặc cơ quan chính phủ dựa trên yêu cầu hợp pháp của quy định pháp luật</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. An toàn thông tin</h2>
      <p>Chúng tôi áp dụng các biện pháp kỹ thuật và quản lý phổ biến trong ngành để bảo vệ thông tin của bạn (mã hóa đường truyền qua HTTPS, lưu trữ cơ sở dữ liệu được mã hóa, kiểm soát quyền truy cập, v.v.). Tuy nhiên, xin lưu ý rằng việc truyền dữ liệu qua Internet không thể bảo đảm an toàn 100%.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Quyền của bạn</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Tra cứu</strong>: Có thể xem tất cả lịch sử lá số và đơn hàng của bạn qua trung tâm tài khoản</li>
        <li><strong>Xóa</strong>: Liên hệ bộ phận chăm sóc khách hàng để xóa lá số chỉ định trong tài khoản / hủy tài khoản</li>
        <li><strong>Xuất dữ liệu</strong>: Có thể yêu cầu xuất toàn bộ dữ liệu cá nhân của bạn</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Cookie và bộ nhớ cục bộ</h2>
      <p>Trang web này sử dụng cookie / localStorage nhằm: lưu tùy chọn giao diện tối/sáng của bạn, lịch sử lá số gần đây, trạng thái đăng nhập hội viên. Bạn có thể tắt trong phần cài đặt của trình duyệt, nhưng một số chức năng có thể bị ảnh hưởng.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. Người chưa thành niên</h2>
      <p>Nội dung mệnh lý trên nền tảng này hướng tới người dùng trưởng thành từ 18 tuổi trở lên. Người chưa thành niên vui lòng sử dụng khi có sự đồng ý của người giám hộ, và không được dùng kết quả luận giải cho các quyết định trọng đại trong đời sống.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>8. Thay đổi chính sách</h2>
      <p>Chính sách này có thể được cập nhật không định kỳ. Những thay đổi quan trọng sẽ được thông báo theo phương thức rõ ràng. Việc tiếp tục sử dụng đồng nghĩa với việc bạn đồng ý với phiên bản đã được cập nhật.</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/terms" style={{ color: 'var(--ac)' }}>Điều khoản dịch vụ</a> · <a href="/" style={{ color: 'var(--ac)' }}>Về trang chủ</a>
        </p>
      </main>
    </>
  );
}
