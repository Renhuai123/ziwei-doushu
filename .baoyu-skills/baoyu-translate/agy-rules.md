# Quy tắc dịch cho agy (Đợt 2+)

Bạn đang ở repo D:\2026\ziwei-doushu (Next.js/TS, app Tử Vi Đẩu Số). Việc của bạn: dịch text hiển thị UI từ tiếng Trung sang tiếng Việt trong ĐÚNG file được giao, không sửa file nào khác.

Đọc trước khi dịch:
- docs/i18n/glossary-ziwei.md: glossary Hán Việt chính thức, dùng nhất quán.
- lib/ziwei/display-vi.ts: export paName, starName, sihuaName, shishenName, stemName, branchName, elementName, juName, anyTermName.
- components/ChartSummary.tsx, components/PalaceCell.tsx: mẫu đã dịch ở Đợt 1, theo đúng văn phong này.

Bắt buộc:
1. Chuỗi chữ Hán dùng làm KHÓA LOGIC (so sánh ===, object key để tra cứu, phần tử Set/Map, URL param/slug, giá trị state) thì KHÔNG đổi. Khi render ra JSX tên sao/cung/can chi/cục lấy từ dữ liệu (star.name, palace.name, dx.palaceName, chart.wuxingJuName, BRANCHES[i], STEMS[i]) thì bọc qua hàm display-vi tương ứng, import từ '@/lib/ziwei/display-vi'.
2. Text UI thuần (tiêu đề, tab, label, nút, placeholder, thông báo, mô tả) dịch thuần Việt, tự nhiên. Thuật ngữ chuyên ngành giữ Hán Việt, viết hoa đầu mỗi âm (Tử Vi, Cung Mệnh, Hóa Lộc, Đại Hạn, Lưu Niên, Tam Phương Tứ Chính). 倪海厦 = Nghê Hải Hạ.
3. Văn bản pháp lý (terms/privacy): dịch sát nghĩa, giữ nguyên nội dung pháp lý, không lược, không thêm.
4. Cổ văn/luận đoán: văn phong Hán Việt trang trọng.
5. Không lược bỏ, không thêm ý. Thuật ngữ không chắc nghĩa thì giữ chữ Hán + " [cần xác nhận]".
6. Giữ nguyên cấu trúc JSX, style, logic, import, tên biến/hàm/prop. Comment code không cần dịch.
7. KHÔNG git add, KHÔNG commit.

Khi xong: chạy `npx tsc --noEmit`, sửa lỗi do bạn gây ra. In ra cuối cùng: danh sách chuỗi chữ Hán còn lại trong file (trừ comment) kèm lý do giữ, và các mục "[cần xác nhận]" nếu có.
