# Giao diện và kết quả tiếng Việt

Ứng dụng hiển thị tiếng Việt, còn dữ liệu kiến thức và thuật toán vẫn giữ nguyên bản gốc. Các thư mục `lib/ziwei`, `lib/classics`, `lib/nihai` và `docs/tianji-ziwei` không được dịch hay thay đổi trong đợt Việt hóa này.

- `lib/i18n/vi.ts`: tên hiển thị Hán–Việt của sao, cung, Can Chi, Tứ Hóa và ngũ hành cục. Chỉ gọi `viTerm()` khi hiển thị; không đưa tên đã dịch trở lại thuật toán, khóa tra cứu hoặc dữ liệu lưu trữ.
- `lib/i18n/locations.vi.ts`: tên địa danh để hiển thị; khóa lựa chọn và kinh độ vẫn dùng dữ liệu gốc.
- Các tệp `home.vi.ts`, `star-details.vi.ts`, `results.vi.ts`: bản dịch hiển thị tách khỏi nội dung gốc. Không dùng chúng làm nguồn suy luận thay cho kiến thức gốc.
- `app/library/searchTerms.ts`: ánh xạ từ khóa Hán–Việt có dấu hoặc không dấu sang thuật ngữ gốc để tìm cổ thư. Đoạn trích tìm được vẫn là bản tiếng Trung, được ghi rõ trên giao diện.

Yêu cầu đến API luận giải và hợp mệnh giữ nguyên cấu trúc lá số, gửi `Accept-Language: vi` và yêu cầu nội dung trả lời bằng tiếng Việt. Kho mã nguồn mở chưa cung cấp các API này; đây không phải một backend AI mới. Khi kiểm tra trình duyệt, phản hồi SSE được mô phỏng để xác minh ngôn ngữ yêu cầu và cách hiển thị kết quả, đồng thời kiểm tra rằng dữ liệu lá số gửi đi vẫn dùng tên sao gốc.

Kiểm tra bằng `npm run typecheck`, `npm test` và `npm run build`. Bộ hồi quy `scripts/regression/vietnamese-display.test.ts` kiểm tra tên sao, Can Chi, địa danh, tìm kiếm tiếng Việt và việc lớp hiển thị không sửa dữ liệu lá số.
