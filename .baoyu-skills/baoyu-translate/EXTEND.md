# EXTEND.md — Zi Wei Dou Shu (ziwei-doushu) project translation config

target_language: vi
default_mode: normal
audience: general
style: "trang trọng, kết hợp Hán Việt cho thuật ngữ chuyên ngành; thuần Việt dễ hiểu cho UI/hướng dẫn"
chunk_threshold: 4000
chunk_max_words: 5000

glossary_files:
  - ../../docs/i18n/glossary-ziwei.md

## Project-specific rules (not covered by generic EXTEND.md schema; apply manually)

1. Giữ nguyên thuật ngữ chuyên ngành Hán Việt của Tử Vi Đẩu Số (tên sao, tên cung, tinh hệ,
   cách cục, tứ hóa, thuật ngữ cổ học) — KHÔNG tự ý Việt hóa / đổi nghĩa các tên riêng này.
2. Văn phong Hán Việt trang trọng khi dịch cổ thư, phú, quyết, luận đoán cổ
   (Thiên Kỷ, Nhân Kỷ, Cốt Tủy Phú, Toàn Tập...).
3. Văn phong thuần Việt, dễ hiểu khi dịch tài liệu giải thích cho người mới
   (form nhập liệu, hướng dẫn, mô tả tính năng).
4. Tài liệu chuyên môn: kết hợp — giữ thuật ngữ Hán Việt, diễn giải bằng tiếng Việt hiện đại.
5. Không tự ý lược bỏ, thêm ý hoặc diễn giải vượt quá nguyên văn.
6. Phân biệt rõ phần dịch nguyên nghĩa và phần chú giải của người dịch — nếu thêm chú giải,
   đặt trong chú thích rõ ràng (ví dụ ngoặc vuông hoặc comment), không lẫn vào văn dịch.
7. Dùng glossary chung tại docs/i18n/glossary-ziwei.md nhất quán cho mọi đợt dịch.
   Mỗi thuật ngữ: chữ Hán, âm Hán Việt, nghĩa tiếng Việt, ghi chú cách dùng.
8. Khi gặp thuật ngữ chưa chắc nghĩa, giữ nguyên chữ Hán kèm chú thích "[cần xác nhận]"
   thay vì đoán.
9. Nhất quán thuật ngữ giữa tất cả file.

## Kỹ thuật (bắt buộc)

- Tên sao/cung/tứ hóa bằng chữ Hán đang được dùng làm KHÓA LOGIC trong engine
  (lib/ziwei/algorithm.ts, lib/ziwei/school-data.ts, lib/ziwei/constants.ts, object-literal keys
  trong app/page.tsx, components/ChartBoard.tsx, lib/ziwei/heming-knowledge.ts) và trong
  regression test (scripts/regression/*.test.ts) — KHÔNG sửa các chuỗi chữ Hán này.
  Chỉ thêm lớp hiển thị (lib/i18n/ hoặc lib/ziwei/display-vi.ts) tra chữ Hán gốc → nhãn tiếng Việt,
  dùng trong component .tsx khi render ra UI.
- Sau mỗi đợt dịch: chạy `npm run typecheck` và `npm test`, phải pass cả hai trước khi commit.
- Mỗi đợt dịch = một commit riêng.
