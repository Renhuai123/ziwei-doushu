# Pipeline Dịch Dataset Tử Vi Đẩu Số

Pipeline dịch tự động các file JSON/JSONL chứa dữ liệu Tử Vi từ tiếng Trung sang tiếng Việt.

## Tính năng

- ✅ **Batch processing**: Xử lý theo batch để tối ưu API calls
- ✅ **Cache mechanism**: Lưu cache theo SHA256 hash, tránh dịch lại cùng nội dung
- ✅ **Checkpoint**: Có thể dừng và resume giữa chừng
- ✅ **Retry logic**: Tự động retry khi gặp lỗi
- ✅ **Validation**: Kiểm tra chất lượng bản dịch sau khi hoàn thành
- ✅ **Glossary-only mode**: Chỉ áp dụng glossary mà không gọi AI (để test)
- ✅ **Dry-run mode**: Chạy thử không ghi kết quả

## Cài đặt

### 1. Biến môi trường

Tạo file `.env.local` hoặc export các biến sau:

```bash
# Provider sử dụng (openai, deepseek, local)
export TRANSLATION_PROVIDER=deepseek

# API key
export TRANSLATION_API_KEY=your_api_key_here

# Base URL (optional, mặc định tùy provider)
export TRANSLATION_BASE_URL=https://api.deepseek.com/v1

# Model name (optional)
export TRANSLATION_MODEL=deepseek-chat

# Batch size (optional, mặc định 10)
export TRANSLATION_BATCH_SIZE=10

# Concurrency (optional, mặc định 2)
export TRANSLATION_CONCURRENCY=2
```

### 2. Cài đặt dependencies

```bash
npm install
```

## Sử dụng

### Dịch cơ bản (dùng local placeholder - chỉ áp glossary)

```bash
npx tsx scripts/translate-dataset/translate-jsonl.ts \
  --input data/input.json \
  --output data/output-vi.json \
  --glossary-only
```

### Dịch với AI provider

```bash
npx tsx scripts/translate-dataset/translate-jsonl.ts \
  --input data/input.json \
  --output data/output-vi.json \
  --provider deepseek
```

### Dry-run (chạy thử không ghi kết quả)

```bash
npx tsx scripts/translate-dataset/translate-jsonl.ts \
  --input data/input.json \
  --output data/output-vi.json \
  --dry-run
```

### Validate kết quả

```bash
npx tsx scripts/translate-dataset/validate.ts \
  --input data/input.json \
  --output data/output-vi.json \
  --report data/translation-report.json
```

## Các chế độ dịch

### 1. Glossary-only mode

Chỉ áp dụng glossary mapping có sẵn, không gọi AI. 
Dùng để:
- Test pipeline
- Dịch nhanh các thuật ngữ cố định
- Tiết kiệm chi phí API

```bash
--glossary-only
```

### 2. AI translation mode

Sử dụng AI provider (OpenAI/DeepSeek) để dịch toàn bộ nội dung.
Ưu điểm:
- Dịch tự nhiên hơn
- Xử lý được ngữ cảnh phức tạp
Nhược điểm:
- Tốn chi phí API
- Cần có API key

```bash
--provider deepseek
```

### 3. Cache mechanism

Cache được lưu trong `.translation-cache/translation-cache.json`.
Key cache = SHA256(sourceText + glossaryVersion).

Khi chạy lại:
- Nếu text đã có trong cache → dùng cache (không gọi AI)
- Nếu text chưa có → gọi AI và lưu vào cache

Để clear cache:
```bash
rm -rf .translation-cache
```

### 4. Checkpoint & Resume

Checkpoint được lưu trong `.translation-checkpoint.json`.
Nếu quá trình dịch bị dừng giữa chừng, chạy lại sẽ tự động resume từ vị trí cũ.

Để force chạy lại từ đầu:
```bash
rm .translation-checkpoint.json
```

## Cấu trúc file

```
scripts/translate-dataset/
├── config.ts           # Cấu hình chung, glossary version, fields cần dịch
├── cache.ts            # Logic cache (load/save/hash)
├── providers.ts        # Các AI providers (OpenAI, DeepSeek, Local)
├── translate-jsonl.ts  # Script chính để dịch
├── validate.ts         # Script validate kết quả
└── README.md           # File này
```

## Fields được dịch

Mặc định pipeline sẽ dịch các field sau (có thể chỉnh trong `config.ts`):

- `summary` - Tóm tắt
- `description` - Mô tả
- `interpretation` - Luận giải
- `explanation` - Giải thích
- `overall` - Tổng quan
- `career` - Sự nghiệp
- `wealth` - Tài vận
- `love` - Tình cảm
- `marriage` - Hôn nhân
- `health` - Sức khỏe
- `personality` - Tính cách
- `family` - Gia đình
- `children` - Con cái
- `parents` - Cha mẹ
- `siblings` - Anh chị em
- `friends` - Bạn bè
- `property` - Điền trạch
- `travel` - Thiên di
- `luck` - Vận may
- `decade` - Đại hạn
- `yearly` - Lưu niên
- `patterns` - Cách cục
- `advice` - Lời khuyên

## Lưu ý quan trọng

1. **Không dịch JSON keys**: Pipeline chỉ dịch values, giữ nguyên keys
2. **Không dịch ID fields**: Các field `id`, `year`, `month`, `day`, `hour`, `gender` không bị thay đổi
3. **Glossary version**: Khi cập nhật glossary, cần tăng `GLOSSARY_VERSION` trong `config.ts` để invalidate cache cũ
4. **Error handling**: Nếu API lỗi, fallback về glossary-only mode
5. **Logs**: Lỗi được log vào console và có thể ghi vào `logs/translation-errors.jsonl`

## Ví dụ workflow đầy đủ

```bash
# 1. Chạy glossary-only trước để test
npx tsx scripts/translate-dataset/translate-jsonl.ts \
  --input data/samples.json \
  --output data/samples-vi-glossary.json \
  --glossary-only

# 2. Validate kết quả glossary-only
npx tsx scripts/translate-dataset/validate.ts \
  --input data/samples.json \
  --output data/samples-vi-glossary.json \
  --report data/glossary-report.json

# 3. Nếu OK, chạy AI translation cho toàn bộ dataset
npx tsx scripts/translate-dataset/translate-jsonl.ts \
  --input data/full-dataset.json \
  --output data/full-dataset-vi.json \
  --provider deepseek

# 4. Validate kết quả cuối cùng
npx tsx scripts/translate-dataset/validate.ts \
  --input data/full-dataset.json \
  --output data/full-dataset-vi.json \
  --report data/final-report.json
```

## Troubleshooting

### Lỗi API key
```
Error: Missing API key for DeepSeek provider
```
→ Check biến môi trường `TRANSLATION_API_KEY`

### Lỗi timeout
```
Error: Timeout
```
→ Giảm `TRANSLATION_BATCH_SIZE` hoặc `TRANSLATION_CONCURRENCY`

### Cache không hoạt động
→ Check file `.translation-cache/translation-cache.json` có tồn tại không
→ Check `GLOSSARY_VERSION` có khớp không

### Kết quả vẫn còn ký tự Trung
→ Đây là bình thường nếu AI không dịch hết
→ Chạy validation để xem tỷ lệ cụ thể
→ Có thể need manual review cho các field quan trọng
