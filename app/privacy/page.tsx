export const metadata = { title: 'Chính sách riêng tư · Lá số Tử Vi', description: 'Chính sách riêng tư của Lá số Tử Vi' };

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Chính sách riêng tư</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Cập nhật lần cuối: tháng 4/2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. Thông tin được thu thập</h2>
      <p>Để cung cấp dịch vụ lập và luận giải lá số Tử Vi, chúng tôi có thể thu thập những thông tin sau:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Thông tin cần thiết để lập lá số</strong>: họ tên (không bắt buộc), ngày tháng năm sinh dương lịch, giờ sinh, giới tính và kinh độ nơi sinh</li>
        <li><strong>Thông tin tài khoản (sau khi đăng ký)</strong>: số điện thoại (phục vụ xác minh SMS và dịch vụ thành viên)</li>
        <li><strong>Thông tin tương tác</strong>: lượt nhấp, hoạt động duyệt trang và lịch sử lá số trên nền tảng</li>
        <li><strong>Thông tin phản hồi</strong>: đánh giá “đúng / chưa đúng” và nhận xét của bạn về nội dung luận giải</li>
        <li><strong>Thông tin thanh toán</strong>: giao dịch mua gói thành viên hoặc dịch vụ riêng lẻ được xử lý qua bên thứ ba (Alipay / WeChat Pay); nền tảng không lưu toàn bộ số thẻ hoặc mật khẩu</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. Cách sử dụng thông tin</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>Thông tin lá số được dùng cho lần luận giải này và lịch sử lá số thuộc tài khoản của bạn</li>
        <li>Số điện thoại được dùng để đăng ký, đăng nhập và gửi thông báo đơn hàng</li>
        <li>Phản hồi được phân tích tổng hợp sau khi loại bỏ thông tin nhận dạng để cải thiện chất lượng nội dung</li>
        <li>Dữ liệu tổng hợp có thể được dùng để nghiên cứu và tối ưu nền tảng</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. Chia sẻ thông tin và bên thứ ba</h2>
      <p>Chúng tôi không chia sẻ thông tin cá nhân với bên thứ ba, trừ các trường hợp sau:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Nhà cung cấp thanh toán (Alipay / WeChat Pay): xử lý thanh toán đơn hàng</li>
        <li>Nhà cung cấp SMS (ví dụ Alibaba Cloud SMS): gửi mã xác minh</li>
        <li>Nhà cung cấp hạ tầng đám mây (ví dụ Vercel / Cloudflare / Alibaba Cloud): vận hành kỹ thuật</li>
        <li>Dịch vụ luận giải AI (ví dụ Anthropic Claude): xử lý hội thoại hỏi thêm sau khi ẩn danh</li>
        <li>Cơ quan tư pháp hoặc cơ quan nhà nước có yêu cầu hợp pháp theo quy định pháp luật</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. Bảo mật thông tin</h2>
      <p>Chúng tôi áp dụng các biện pháp kỹ thuật và quản lý thông dụng để bảo vệ thông tin, như mã hóa truyền tải HTTPS, mã hóa dữ liệu lưu trữ và kiểm soát quyền truy cập. Tuy nhiên, việc truyền dữ liệu qua Internet không thể được bảo đảm an toàn tuyệt đối.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Quyền của bạn</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Tra cứu</strong>: xem lịch sử lá số và đơn hàng trong trang quản lý tài khoản</li>
        <li><strong>Xóa dữ liệu</strong>: liên hệ hỗ trợ để xóa lá số cụ thể hoặc đóng tài khoản</li>
        <li><strong>Xuất dữ liệu</strong>: yêu cầu xuất toàn bộ dữ liệu cá nhân của bạn</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Cookie và lưu trữ cục bộ</h2>
      <p>Website sử dụng cookie / localStorage để lưu lựa chọn giao diện sáng hoặc tối, lịch sử lá số gần đây và trạng thái đăng nhập thành viên. Bạn có thể tắt trong cài đặt trình duyệt, nhưng một số tính năng có thể bị ảnh hưởng.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. Người chưa thành niên</h2>
      <p>Nội dung mệnh lý trên nền tảng dành cho người từ 18 tuổi. Người chưa thành niên cần có sự đồng ý của người giám hộ và không được dùng luận giải để đưa ra các quyết định quan trọng trong cuộc sống.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>8. Thay đổi chính sách</h2>
      <p>Chính sách có thể được cập nhật định kỳ. Các thay đổi quan trọng sẽ được thông báo rõ ràng. Việc tiếp tục sử dụng đồng nghĩa với việc chấp thuận phiên bản đã cập nhật.</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/terms" style={{ color: 'var(--ac)' }}>Điều khoản sử dụng</a> · <a href="/" style={{ color: 'var(--ac)' }}>Về trang chủ</a>
        </p>
      </main>
    </>
  );
}
