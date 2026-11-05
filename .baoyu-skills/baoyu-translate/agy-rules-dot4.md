# Quy tắc Đợt 4 — Dịch hoàn tất hệ thống tài liệu & ngữ liệu Thiên Kỷ Nghê Hải Hạ

ĐỌC KỸ `agy-rules.md`, `agy-rules-dot3.md` và `docs/i18n/glossary-ziwei.md` trước khi dịch.

## 1. Mục tiêu Đợt 4
- Dịch hoàn tất toàn bộ các file tài liệu, giới thiệu và kho ngữ liệu danh ngôn/giáo án Thiên Kỷ của thầy Nghê Hải Hạ (`docs/tianji-ziwei/*.md`).
- Dịch `lib/nihai/index.ts` (tiểu sử `NI_HAIXIA_BIO`, `SANJI_CATEGORIES`).
- Dịch tài liệu dự án (`README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `docs/tianji-ziwei/README.md`).

## 2. Văn phong và quy chuẩn dịch
1. **Thuật ngữ chuyên ngành Tử Vi Đẩu Số**:
   - Dùng đúng âm Hán Việt chuẩn xác theo `docs/i18n/glossary-ziwei.md`.
   - Viết hoa chữ cái đầu mỗi âm đối với tên sao, tên cung, cách cục, tứ hóa, thần sát: Tử Vi, Thiên Phủ, Thái Dương, Cung Mệnh, Cung Quan Lộc, Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ, Kình Dương, Đà La, Không Kiếp, Tam Phương Tứ Chính, Cốt Tủy Phú.
   - Thầy Nghê Hải Hạ: 倪海厦 / 倪师 → Thầy Nghê / Nghê sư / Nghê Hải Hạ.

2. **Cấu trúc trích dẫn trong `docs/tianji-ziwei/*.md`**:
   - Định dạng gốc:
     `- [hh:mm:ss](url) 「Nguyên văn lời thầy Nghê」〔Ghi chú khảo chứng〕 <sub>Phân loại › Chuyên đề</sub>`
   - Dịch sang:
     `- [hh:mm:ss](url) 「Lời dịch tiếng Việt thoát nghĩa nhưng chuẩn xác, trang trọng」〔Ghi chú khảo chứng dịch sang tiếng Việt〕 <sub>Phân loại › Chuyên đề (dịch Hán Việt/Việt)</sub>`
   - GIỮ NGUYÊN mốc thời gian và URL `[hh:mm:ss](url)`.
   - GIỮ NGUYÊN cấu trúc thẻ `<sub>...</sub>` và dấu `「...」`, `〔...〕`.

3. **Tiêu đề và đề mục (§)**:
   - Dịch tiêu đề chương, đề mục Hán Việt kết hợp thuần Việt rõ ràng, dễ hiểu:
     Ví dụ: `## §1 00:00:01 开场：文字与真理、学而后思`
     → `## §1 00:00:01 Mở đầu: Văn tự và chân lý, học rồi mới suy ngẫm`

4. **Kỹ thuật & Code**:
   - Trong `lib/nihai/index.ts`: các object key logic tiếng Anh (`name`, `birth`, `timeline`, `publications`, `schools`, `year`, `event`, v.v.) GIỮ NGUYÊN.
   - Chỉ dịch value hiển thị (nội dung text tiếng Trung sang tiếng Việt).
   - Tuyệt đối không làm gãy type check (`npm run typecheck`).
