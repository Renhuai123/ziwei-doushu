/**
 * Hàm dịch thuật ngữ Trung → Việt sử dụng glossary
 * Replace từ dài trước để tránh lỗi replace chồng chéo
 */

import { ZH_TO_VI_MAP } from './zh-vi-glossary';

/**
 * Dịch các thuật ngữ Hán-Việt trong text
 * @param input - Text tiếng Trung cần dịch
 * @returns Text đã replace các thuật ngữ theo glossary
 */
export function translateZhTermsToVi(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Sort keys by length (descending) to replace longer terms first
  // This prevents partial replacements like replacing "紫" before "紫微"
  const sortedKeys = Object.keys(ZH_TO_VI_MAP).sort((a, b) => b.length - a.length);

  let result = input;
  for (const key of sortedKeys) {
    const regex = new RegExp(key, 'g');
    result = result.replace(regex, ZH_TO_VI_MAP[key]);
  }

  return result;
}

/**
 * Kiểm tra xem text có chứa ký tự Trung Quốc không
 * @param text - Text cần kiểm tra
 * @returns true nếu có ký tự Trung Quốc
 */
export function hasChineseChars(text: string): boolean {
  if (!text) return false;
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * Đếm số lượng ký tự Trung Quốc trong text
 * @param text - Text cần đếm
 * @returns Số lượng ký tự Trung Quốc
 */
export function countChineseChars(text: string): number {
  if (!text) return 0;
  const matches = text.match(/[\u4e00-\u9fff]/g);
  return matches ? matches.length : 0;
}

/**
 * Áp dụng glossary cho một object JSON (chỉ dịch value, không dịch key)
 * @param obj - Object cần áp glossary
 * @param fields - Danh sách field cần dịch (nếu không truyền thì duyệt tất cả string values)
 * @returns Object mới với các value đã được áp glossary
 */
export function applyGlossaryToObject<T extends Record<string, any>>(
  obj: T,
  fields?: string[]
): T {
  const result = { ...obj };

  const shouldTranslate = (key: string) => {
    if (!fields) return true;
    return fields.includes(key);
  };

  const processValue = (value: any): any => {
    if (typeof value === 'string') {
      return translateZhTermsToVi(value);
    }
    if (Array.isArray(value)) {
      return value.map(item => processValue(item));
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedResult: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        nestedResult[k] = processValue(v);
      }
      return nestedResult;
    }
    return value;
  };

  for (const [key, value] of Object.entries(result)) {
    if (shouldTranslate(key)) {
      result[key] = processValue(value);
    }
  }

  return result;
}

// Test đơn giản
if (require.main === module) {
  console.log('=== Test translateZhTermsToVi ===');
  
  const testCases = [
    '紫微在命宫',
    '天机化禄入夫妻宫',
    '太阳太阴同宫',
    '武曲七杀在官禄',
    '甲年生人化禄在廉贞',
    '子时生人命宫在午',
    '庙旺得地不陷',
  ];

  testCases.forEach(test => {
    console.log(`Input:  ${test}`);
    console.log(`Output: ${translateZhTermsToVi(test)}`);
    console.log('---');
  });
}
