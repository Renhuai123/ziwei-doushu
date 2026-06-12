/**
 * Types cho hệ thống i18n Tử Vi Đẩu Số
 */

export interface TranslationOptions {
  /** Chỉ áp dụng glossary, không gọi AI */
  glossaryOnly?: boolean;
  /** Dry-run, không ghi kết quả */
  dryRun?: boolean;
  /** Batch size khi dịch dataset lớn */
  batchSize?: number;
  /** Số lượng concurrent requests */
  concurrency?: number;
}

export interface TranslationResult {
  /** Text gốc */
  source: string;
  /** Text đã dịch */
  translated: string;
  /** Có dùng cache không */
  fromCache: boolean;
  /** Lỗi nếu có */
  error?: string;
}

export interface TranslationCacheEntry {
  sourceHash: string;
  translated: string;
  glossaryVersion: string;
  timestamp: number;
}

export interface DatasetTranslationConfig {
  /** Provider sử dụng (openai, deepseek, local) */
  provider: string;
  /** API key */
  apiKey?: string;
  /** Base URL cho API */
  baseUrl?: string;
  /** Model name */
  model?: string;
  /** Glossary version */
  glossaryVersion: string;
  /** Các field cần dịch trong JSON */
  translatableFields: string[];
  /** Cache directory */
  cacheDir?: string;
  /** Log directory */
  logDir?: string;
}

export interface TranslationProvider {
  translate(input: string, options?: TranslationOptions): Promise<string>;
}

export interface TranslationReport {
  totalItems: number;
  translatedItems: number;
  cachedItems: number;
  failedItems: number;
  chineseCharsRemaining: number;
  elapsedMs: number;
  errors: Array<{
    itemIndex: number;
    sourceId?: string;
    error: string;
  }>;
}
