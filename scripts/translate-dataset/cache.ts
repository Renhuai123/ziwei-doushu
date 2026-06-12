/**
 * Cache mechanism cho translation
 * Sử dụng SHA256 hash của source text + glossary version làm key
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { TranslationCacheEntry } from '../../lib/i18n/types';
import { GLOSSARY_VERSION } from './config';

const CACHE_FILE = 'translation-cache.json';

/**
 * Tạo hash SHA256 từ text
 */
export function createHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Tạo cache key từ source text và glossary version
 */
export function createCacheKey(sourceText: string, glossaryVersion: string = GLOSSARY_VERSION): string {
  return createHash(`${sourceText}|${glossaryVersion}`);
}

/**
 * Load cache từ file
 */
export function loadCache(cacheDir: string): Record<string, TranslationCacheEntry> {
  const cachePath = path.join(cacheDir, CACHE_FILE);
  
  if (!fs.existsSync(cachePath)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Không thể load cache, tạo cache mới:', error);
    return {};
  }
}

/**
 * Lưu cache vào file
 */
export function saveCache(cacheDir: string, cache: Record<string, TranslationCacheEntry>): void {
  // Đảm bảo thư mục cache tồn tại
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  const cachePath = path.join(cacheDir, CACHE_FILE);
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Lấy bản dịch từ cache
 */
export function getFromCache(
  cache: Record<string, TranslationCacheEntry>,
  sourceText: string,
  glossaryVersion: string = GLOSSARY_VERSION
): string | null {
  const key = createCacheKey(sourceText, glossaryVersion);
  const entry = cache[key];
  
  if (entry && entry.glossaryVersion === glossaryVersion) {
    return entry.translated;
  }
  
  return null;
}

/**
 * Thêm bản dịch vào cache
 */
export function addToCache(
  cache: Record<string, TranslationCacheEntry>,
  sourceText: string,
  translated: string,
  glossaryVersion: string = GLOSSARY_VERSION
): void {
  const key = createCacheKey(sourceText, glossaryVersion);
  cache[key] = {
    sourceHash: key,
    translated,
    glossaryVersion,
    timestamp: Date.now(),
  };
}

/**
 * Xóa cache cũ (optional cleanup)
 */
export function cleanupCache(
  cache: Record<string, TranslationCacheEntry>,
  maxAgeDays: number = 30
): Record<string, TranslationCacheEntry> {
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  
  const newCache: Record<string, TranslationCacheEntry> = {};
  
  for (const [key, entry] of Object.entries(cache)) {
    if (now - entry.timestamp < maxAgeMs) {
      newCache[key] = entry;
    }
  }
  
  return newCache;
}

/**
 * Thống kê cache
 */
export function getCacheStats(cache: Record<string, TranslationCacheEntry>): {
  totalEntries: number;
  uniqueSources: number;
} {
  return {
    totalEntries: Object.keys(cache).length,
    uniqueSources: new Set(Object.values(cache).map(e => e.sourceHash)).size,
  };
}
