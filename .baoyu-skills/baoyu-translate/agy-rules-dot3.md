# Quy tắc Đợt 3 — dịch nội dung cổ thư / luận đoán (BỔ SUNG cho agy-rules.md)

ĐỌC agy-rules.md trước. File này bổ sung cho nội dung cổ văn / luận đoán.

## Văn phong
- Cổ thư, phú, quyết, luận đoán cổ (classics, nihai, patterns description, famous): văn phong Hán Việt TRANG TRỌNG. Giữ thuật ngữ Hán Việt (tên sao/cung/tứ hóa/cách cục), dịch phần diễn giải sang tiếng Việt hiện đại nhưng giữ sắc thái cổ.
- Câu quyết/phú chữ Hán nguyên văn (ví dụ "府相朝垣千钟食禄"): phiên âm Hán Việt trong ngoặc kép ("Phủ Tướng triều viên thiên chung thực lộc") rồi có thể diễn nghĩa ngắn sau đó, KHÔNG bịa thêm ý.
- Không lược bỏ, không thêm ý vượt nguyên văn.

## Khóa logic — CỰC KỲ QUAN TRỌNG với patterns.ts
patterns.ts trộn lẫn khóa logic và text hiển thị. Phân biệt:

1. CHUỖI HÁN LÀ KHÓA LOGIC — TUYỆT ĐỐI KHÔNG ĐỔI:
   - Đối số của các hàm: `.has('文昌')`, `hasStar(x, '禄存')`, `findStar(p, '紫微')`, `hasShaInPalace(p, ['擎羊','陀罗'])`, `getStarSiHua(x, '紫微')`, `isBright(s, '太阳')`, `isDim(...)`, `palaceHasSiHua(x, '禄')`, `sanFangHasSiHua(chart, '科')`.
   - So sánh: `=== '权'`, `=== '禄'`, `s.name === '文昌'`, v.v.
   - Phần tử trong các mảng hằng số: SHA_NAMES, SHA_HARD, ZUO_YOU, CHANG_QU... (các mảng tên sao ở đầu file).
   - Giá trị `palaces: [...]` nếu là tên cung chữ Hán dùng để match — giữ nguyên chữ Hán (UI đã bọc paName ở lớp component).

2. CHUỖI HÁN LÀ TEXT HIỂN THỊ — DỊCH:
   - Giá trị truyền vào `.push(...)`: `bonus.push('再会文昌或文曲')` → `bonus.push('Lại hội Văn Xương hoặc Văn Khúc')`. Đây là text hiện ra UI ở PatternsCard.
   - Các field của object `patterns.push({ ... })`: `name`, `description`, `source`. Dịch hết.
   - `name` cách cục (ví dụ '君臣庆会' → 'Quân Thần Khánh Hội'), giữ dạng Hán Việt viết hoa đầu âm.
   - `source` (ví dụ '《紫微斗数全书·君臣庆会格》' → '《Tử Vi Đẩu Số Toàn Thư · Quân Thần Khánh Hội Cách》').

QUY TẮC VÀNG: nếu chuỗi Hán nằm BÊN TRONG dấu () của một lời gọi hàm so khớp/tra cứu, hoặc trong mảng hằng tên sao, hoặc sau ===, thì đó là KHÓA LOGIC — giữ nguyên. Nếu chuỗi Hán là đối số của .push() hoặc là value của name/description/source/summary/good/bad/... thì đó là TEXT — dịch. Khi phân vân, grep chuỗi đó xem có xuất hiện ở chỗ so khớp nào khác không; nếu có, giữ nguyên.

## Sau khi sửa patterns.ts (BẮT BUỘC)
Chạy: `npx tsx scripts/regression/patterns-sihua-bonus.test.ts` — nếu test này tồn tại và chạy được thì phải pass. Nếu nó lỗi sẵn do môi trường (ERR loader), bỏ qua. Và chạy `npx tsx scripts/regression/neutral-naming.test.ts` phải pass. Và `npx tsc --noEmit` phải pass.

## lib/nihai/*, lib/classics/data/*, lib/seo/knowledge.ts, lib/ziwei/famous.ts
Chủ yếu là object literal với key chữ Hán (tên sao/cung/chương) và value là văn bản luận đoán. Giữ KEY, dịch VALUE (văn bản). Tên người nổi tiếng trong famous.ts: giữ nguyên tên gốc (tên riêng), chỉ dịch mô tả/highlight. Grep kiểm tra key có bị dùng để tra cứu ở file khác không trước khi đổi — mặc định KHÔNG đổi key.
