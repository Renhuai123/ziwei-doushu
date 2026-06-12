/**
 * Cấu hình cho pipeline dịch dataset Tử Vi Đẩu Số
 */

import type { DatasetTranslationConfig } from '../../lib/i18n/types';

// Version của glossary - dùng để invalidate cache khi cập nhật glossary
export const GLOSSARY_VERSION = '1.0.0';

// Các field có thể dịch trong JSON dataset
export const TRANSLATABLE_FIELDS = [
  // Tổng quan
  'summary',
  'description',
  'interpretation',
  'explanation',
  'overall',
  
  // Các lĩnh vực cuộc sống
  'career',      // Sự nghiệp
  'wealth',      // Tài vận
  'love',        // Tình cảm
  'marriage',    // Hôn nhân
  'health',      // Sức khỏe
  'personality', // Tính cách
  
  // Gia đình
  'family',      // Gia đình
  'children',    // Con cái
  'parents',     // Cha mẹ
  'siblings',    // Anh chị em
  
  // Xã hội
  'friends',     // Bạn bè
  'property',    // Nhà cửa/điền trạch
  'travel',      // Du lịch/thiên di
  'luck',        // Vận may
  
  // Thời vận
  'decade',      // Đại hạn
  'yearly',      // Lưu niên
  
  // Cách cục
  'patterns',    // Các cách cục
  'advice',      // Lời khuyên
];

// Default config
export const DEFAULT_CONFIG: Omit<DatasetTranslationConfig, 'provider'> = {
  glossaryVersion: GLOSSARY_VERSION,
  translatableFields: TRANSLATABLE_FIELDS,
  cacheDir: '.translation-cache',
  logDir: 'logs',
};

// Prompt mặc định cho AI translation
export const TRANSLATION_PROMPT = `Bạn là chuyên gia dịch thuật Tử Vi Đẩu Số Trung-Việt.
Hãy dịch văn bản tiếng Trung sang tiếng Việt tự nhiên, dễ hiểu.

Yêu cầu:
1. Giữ nguyên ý gốc, không thêm nội dung mới, không bỏ sót ý
2. Thuật ngữ Tử Vi phải dùng Hán Việt chuẩn theo glossary
3. Không dịch tên sao/cung sai nghĩa
4. Chỉ trả về bản dịch, không giải thích, không markdown

Glossary thuật ngữ:
{{glossary}}

Input:
{{text}}`;

// Provider mapping
export const SUPPORTED_PROVIDERS = ['openai', 'deepseek', 'local'] as const;
export type SupportedProvider = typeof SUPPORTED_PROVIDERS[number];

// Environment variables
export const ENV_VARS = {
  PROVIDER: 'TRANSLATION_PROVIDER',
  API_KEY: 'TRANSLATION_API_KEY',
  BASE_URL: 'TRANSLATION_BASE_URL',
  MODEL: 'TRANSLATION_MODEL',
  BATCH_SIZE: 'TRANSLATION_BATCH_SIZE',
  CONCURRENCY: 'TRANSLATION_CONCURRENCY',
} as const;

// Default values từ env
export function getConfigFromEnv(): Partial<DatasetTranslationConfig> {
  const config: Partial<DatasetTranslationConfig> = {};
  
  if (process.env[ENV_VARS.BASE_URL]) {
    config.baseUrl = process.env[ENV_VARS.BASE_URL];
  }
  
  return config;
}
