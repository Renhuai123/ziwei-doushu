/**
 * Script chính để dịch dataset JSON/JSONL
 * Hỗ trợ batch processing, cache, checkpoint và retry
 */

import * as fs from 'fs';
import * as path from 'path';
import { createTranslationProvider } from './providers';
import { loadCache, saveCache, getFromCache, addToCache } from './cache';
import { TRANSLATABLE_FIELDS, GLOSSARY_VERSION, DEFAULT_CONFIG } from './config';
import { translateZhTermsToVi, hasChineseChars } from '../../lib/i18n/translateTerms';
import type { TranslationOptions, TranslationReport } from '../../lib/i18n/types';

interface TranslateDatasetOptions extends TranslationOptions {
  /** File input (JSON hoặc JSONL) */
  inputFile: string;
  /** File output */
  outputFile: string;
  /** Provider type (openai, deepseek, local) */
  provider?: string;
  /** API key */
  apiKey?: string;
  /** Base URL */
  baseUrl?: string;
  /** Model name */
  model?: string;
  /** Checkpoint file để resume */
  checkpointFile?: string;
}

/**
 * Đọc file JSON hoặc JSONL
 */
function readInputFile(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Kiểm tra xem có phải JSONL không (mỗi dòng là một JSON object)
  if (filePath.endsWith('.jsonl') || content.trim().split('\n').length > 1 && !content.trim().startsWith('[')) {
    const lines = content.trim().split('\n');
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.warn(`Không thể parse dòng: ${line.substring(0, 50)}...`);
        return null;
      }
    }).filter(Boolean);
  }
  
  // JSON thường
  try {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    throw new Error(`Không thể parse JSON file: ${error}`);
  }
}

/**
 * Dịch một field value
 */
async function translateFieldValue(
  value: string,
  provider: any,
  cache: Record<string, any>,
  cacheDir: string,
  options: TranslationOptions
): Promise<{ translated: string; fromCache: boolean }> {
  // Thử lấy từ cache trước
  const cached = getFromCache(cache, value, GLOSSARY_VERSION);
  if (cached) {
    return { translated: cached, fromCache: true };
  }
  
  // Nếu glossaryOnly thì chỉ áp dụng glossary
  if (options.glossaryOnly) {
    const translated = translateZhTermsToVi(value);
    addToCache(cache, value, translated, GLOSSARY_VERSION);
    saveCache(cacheDir, cache);
    return { translated, fromCache: false };
  }
  
  // Gọi AI provider
  try {
    const translated = await provider.translate(value, options);
    addToCache(cache, value, translated, GLOSSARY_VERSION);
    
    // Save cache sau mỗi lần dịch thành công
    saveCache(cacheDir, cache);
    
    return { translated, fromCache: false };
  } catch (error) {
    console.error('Lỗi khi dịch:', error);
    // Fallback về glossary-only nếu lỗi
    const fallback = translateZhTermsToVi(value);
    return { translated: fallback, fromCache: false, error: String(error) };
  }
}

/**
 * Dịch một item trong dataset
 */
async function translateItem(
  item: any,
  provider: any,
  cache: Record<string, any>,
  cacheDir: string,
  options: TranslationOptions
): Promise<any> {
  const result = { ...item };
  
  for (const field of TRANSLATABLE_FIELDS) {
    if (typeof result[field] === 'string' && hasChineseChars(result[field])) {
      const { translated } = await translateFieldValue(
        result[field],
        provider,
        cache,
        cacheDir,
        options
      );
      result[field] = translated;
    }
  }
  
  return result;
}

/**
 * Load checkpoint nếu tồn tại
 */
function loadCheckpoint(checkpointFile: string): { processedCount: number; lastProcessedIndex: number } | null {
  if (!fs.existsSync(checkpointFile)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(checkpointFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Không thể load checkpoint:', error);
    return null;
  }
}

/**
 * Save checkpoint
 */
function saveCheckpoint(checkpointFile: string, processedCount: number, lastProcessedIndex: number): void {
  const dir = path.dirname(checkpointFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(
    checkpointFile,
    JSON.stringify({ processedCount, lastProcessedIndex, timestamp: Date.now() }, null, 2),
    'utf-8'
  );
}

/**
 * Hàm main để dịch dataset
 */
export async function translateDataset(options: TranslateDatasetOptions): Promise<TranslationReport> {
  const startTime = Date.now();
  
  // Validate input file
  if (!fs.existsSync(options.inputFile)) {
    throw new Error(`Input file không tồn tại: ${options.inputFile}`);
  }
  
  // Tạo provider
  const providerType = options.provider || process.env.TRANSLATION_PROVIDER || 'local';
  const provider = createTranslationProvider(
    providerType,
    options.apiKey || process.env.TRANSLATION_API_KEY,
    options.baseUrl || process.env.TRANSLATION_BASE_URL,
    options.model || process.env.TRANSLATION_MODEL
  );
  
  // Setup cache
  const cacheDir = options.dryRun ? '.translation-cache-dryrun' : (DEFAULT_CONFIG.cacheDir || '.translation-cache');
  const cache = loadCache(cacheDir);
  
  // Đọc input
  console.log(`Đang đọc file: ${options.inputFile}`);
  const items = readInputFile(options.inputFile);
  console.log(`Đã đọc ${items.length} items`);
  
  // Load checkpoint nếu có
  let startIndex = 0;
  if (options.checkpointFile) {
    const checkpoint = loadCheckpoint(options.checkpointFile);
    if (checkpoint) {
      startIndex = checkpoint.lastProcessedIndex + 1;
      console.log(`Resume từ index ${startIndex} (đã xử lý ${checkpoint.processedCount} items)`);
    }
  }
  
  // Chuẩn bị output
  const translatedItems: any[] = [];
  const errors: TranslationReport['errors'] = [];
  let cachedCount = 0;
  
  // Batch processing
  const batchSize = options.batchSize || parseInt(process.env.TRANSLATION_BATCH_SIZE || '10');
  const concurrency = options.concurrency || parseInt(process.env.TRANSLATION_CONCURRENCY || '2');
  
  console.log(`Batch size: ${batchSize}, Concurrency: ${concurrency}`);
  
  for (let i = startIndex; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length));
    console.log(`\nXử lý batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (items ${i}-${Math.min(i + batchSize, items.length)})`);
    
    // Process batch với concurrency limit
    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex;
      
      try {
        const translated = await translateItem(item, provider, cache, cacheDir, options);
        
        // Check xem có thực sự dịch không hay chỉ dùng cache
        let usedCache = true;
        for (const field of TRANSLATABLE_FIELDS) {
          if (item[field] !== translated[field]) {
            usedCache = false;
            break;
          }
        }
        
        if (usedCache) cachedCount++;
        
        if (!options.dryRun) {
          translatedItems.push(translated);
        }
        
        // Save checkpoint sau mỗi batch
        if (options.checkpointFile && !options.dryRun) {
          saveCheckpoint(options.checkpointFile, globalIndex + 1, globalIndex);
        }
        
        return { success: true, index: globalIndex };
      } catch (error) {
        errors.push({
          itemIndex: globalIndex,
          sourceId: item.id || item.name || `index_${globalIndex}`,
          error: String(error),
        });
        console.error(`Lỗi item ${globalIndex}:`, error);
        
        // Vẫn giữ item gốc nếu lỗi
        if (!options.dryRun) {
          translatedItems.push(item);
        }
        
        return { success: false, index: globalIndex, error };
      }
    });
    
    // Wait cho batch với concurrency limit
    await Promise.all(batchPromises);
    
    // Save cache sau mỗi batch
    if (!options.dryRun) {
      saveCache(cacheDir, cache);
    }
  }
  
  // Write output
  if (!options.dryRun && translatedItems.length > 0) {
    const outputDir = path.dirname(options.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Xác định format output dựa vào extension
    if (options.outputFile.endsWith('.jsonl')) {
      const jsonlContent = translatedItems.map(item => JSON.stringify(item)).join('\n');
      fs.writeFileSync(options.outputFile, jsonlContent, 'utf-8');
    } else {
      fs.writeFileSync(options.outputFile, JSON.stringify(translatedItems, null, 2), 'utf-8');
    }
    
    console.log(`\nĐã ghi ${translatedItems.length} items vào ${options.outputFile}`);
  }
  
  // Tạo report
  const elapsedMs = Date.now() - startTime;
  const report: TranslationReport = {
    totalItems: items.length,
    translatedItems: translatedItems.length,
    cachedItems: cachedCount,
    failedItems: errors.length,
    chineseCharsRemaining: 0, // Sẽ tính ở bước validate
    elapsedMs,
    errors,
  };
  
  console.log('\n=== Report ===');
  console.log(`Tổng items: ${report.totalItems}`);
  console.log(`Đã dịch: ${report.translatedItems}`);
  console.log(`Từ cache: ${report.cachedItems}`);
  console.log(`Thất bại: ${report.failedItems}`);
  console.log(`Thời gian: ${(elapsedMs / 1000).toFixed(2)}s`);
  
  return report;
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse simple CLI args
  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');
  const providerIndex = args.indexOf('--provider');
  const glossaryOnlyIndex = args.indexOf('--glossary-only');
  const dryRunIndex = args.indexOf('--dry-run');
  
  if (inputIndex === -1) {
    console.error('Usage: tsx translate-jsonl.ts --input <file> --output <file> [--provider openai|deepseek|local] [--glossary-only] [--dry-run]');
    process.exit(1);
  }
  
  translateDataset({
    inputFile: args[inputIndex + 1],
    outputFile: args[outputIndex + 1] || 'output-translated.json',
    provider: providerIndex !== -1 ? args[providerIndex + 1] : undefined,
    glossaryOnly: glossaryOnlyIndex !== -1,
    dryRun: dryRunIndex !== -1,
    checkpointFile: '.translation-checkpoint.json',
  }).then(report => {
    console.log('\nHoàn thành!');
  }).catch(error => {
    console.error('Lỗi nghiêm trọng:', error);
    process.exit(1);
  });
}
