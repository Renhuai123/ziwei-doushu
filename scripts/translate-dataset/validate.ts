/**
 * Validate chất lượng bản dịch
 */

import * as fs from 'fs';
import { hasChineseChars, countChineseChars } from '../../lib/i18n/translateTerms';
import { TRANSLATABLE_FIELDS } from './config';
import type { TranslationReport } from '../../lib/i18n/types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalItems: number;
    itemsWithChineseChars: number;
    chineseCharCount: number;
    missingFields: number;
    changedIds: number;
  };
}

/**
 * Validate JSON output sau khi dịch
 */
export function validateTranslatedJson(
  inputFile: string,
  outputFile: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Đọc files
  let inputItems: any[];
  let outputItems: any[];
  
  try {
    const inputContent = fs.readFileSync(inputFile, 'utf-8');
    inputItems = JSON.parse(inputContent);
    if (!Array.isArray(inputItems)) {
      inputItems = [inputItems];
    }
  } catch (error) {
    errors.push(`Không thể đọc file input: ${error}`);
    return { isValid: false, errors, warnings, stats: { totalItems: 0, itemsWithChineseChars: 0, chineseCharCount: 0, missingFields: 0, changedIds: 0 } };
  }
  
  try {
    const outputContent = fs.readFileSync(outputFile, 'utf-8');
    outputItems = JSON.parse(outputContent);
    if (!Array.isArray(outputItems)) {
      outputItems = [outputItems];
    }
  } catch (error) {
    errors.push(`Không thể đọc file output: ${error}`);
    return { isValid: false, errors, warnings, stats: { totalItems: 0, itemsWithChineseChars: 0, chineseCharCount: 0, missingFields: 0, changedIds: 0 } };
  }
  
  // Check số lượng items
  if (inputItems.length !== outputItems.length) {
    errors.push(`Số lượng items không khớp: input=${inputItems.length}, output=${outputItems.length}`);
  }
  
  let itemsWithChineseChars = 0;
  let totalChineseChars = 0;
  let missingFields = 0;
  let changedIds = 0;
  
  // Validate từng item
  for (let i = 0; i < Math.min(inputItems.length, outputItems.length); i++) {
    const inputItem = inputItems[i];
    const outputItem = outputItems[i];
    
    // Check ID không đổi
    const idFields = ['id', 'year', 'month', 'day', 'hour', 'gender'];
    for (const field of idFields) {
      if (inputItem[field] !== undefined && inputItem[field] !== outputItem[field]) {
        errors.push(`Item ${i}: Field '${field}' bị thay đổi từ ${inputItem[field]} sang ${outputItem[field]}`);
        changedIds++;
      }
    }
    
    // Check các field cần dịch
    for (const field of TRANSLATABLE_FIELDS) {
      if (inputItem[field] !== undefined) {
        if (outputItem[field] === undefined) {
          warnings.push(`Item ${i}: Thiếu field '${field}'`);
          missingFields++;
        } else if (typeof outputItem[field] !== 'string') {
          warnings.push(`Item ${i}: Field '${field}' không phải string`);
        } else if (hasChineseChars(outputItem[field])) {
          itemsWithChineseChars++;
          totalChineseChars += countChineseChars(outputItem[field]);
        }
      }
    }
  }
  
  // Kiểm tra tỷ lệ ký tự Trung còn sót
  const totalTranslatableFields = inputItems.length * TRANSLATABLE_FIELDS.length;
  const chineseCharRatio = totalTranslatableFields > 0 
    ? (itemsWithChineseChars / totalTranslatableFields) * 100 
    : 0;
  
  if (chineseCharRatio > 5) {
    warnings.push(`Tỷ lệ field còn ký tự Trung Quốc: ${chineseCharRatio.toFixed(2)}% (${itemsWithChineseChars}/${totalTranslatableFields})`);
  }
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    warnings,
    stats: {
      totalItems: inputItems.length,
      itemsWithChineseChars,
      chineseCharCount: totalChineseChars,
      missingFields,
      changedIds,
    },
  };
}

/**
 * Generate translation report
 */
export function generateTranslationReport(
  validation: ValidationResult,
  outputPath: string
): void {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      isValid: validation.isValid,
      totalErrors: validation.errors.length,
      totalWarnings: validation.warnings.length,
    },
    stats: validation.stats,
    errors: validation.errors,
    warnings: validation.warnings,
    recommendations: [],
  };
  
  // Thêm recommendations
  if (validation.stats.itemsWithChineseChars > 0) {
    report.recommendations.push(
      `Có ${validation.stats.itemsWithChineseChars} field còn ký tự Trung Quốc. Nên review lại các field này.`
    );
  }
  
  if (validation.stats.missingFields > 0) {
    report.recommendations.push(
      `Có ${validation.stats.missingFields} field bị thiếu. Kiểm tra xem có phải do input không có hay do lỗi dịch.`
    );
  }
  
  if (validation.stats.changedIds > 0) {
    report.recommendations.push(
      `Có ${validation.stats.changedIds} item bị thay đổi ID/key fields. Đây là lỗi nghiêm trọng cần sửa ngay.`
    );
  }
  
  // Ghi report
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Đã ghi report vào ${outputPath}`);
}

// CLI entry point
import * as path from 'path';

if (require.main === module) {
  const args = process.argv.slice(2);
  
  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');
  const reportIndex = args.indexOf('--report');
  
  if (inputIndex === -1 || outputIndex === -1) {
    console.error('Usage: tsx validate.ts --input <original.json> --output <translated.json> [--report <report.json>]');
    process.exit(1);
  }
  
  const result = validateTranslatedJson(args[inputIndex + 1], args[outputIndex + 1]);
  
  console.log('\n=== Validation Result ===');
  console.log(`Valid: ${result.isValid}`);
  console.log(`Total Items: ${result.stats.totalItems}`);
  console.log(`Items with Chinese chars: ${result.stats.itemsWithChineseChars}`);
  console.log(`Total Chinese chars: ${result.stats.chineseCharCount}`);
  console.log(`Missing fields: ${result.stats.missingFields}`);
  console.log(`Changed IDs: ${result.stats.changedIds}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  // Generate report nếu có yêu cầu
  if (reportIndex !== -1) {
    generateTranslationReport(result, args[reportIndex + 1]);
  }
  
  process.exit(result.isValid ? 0 : 1);
}
