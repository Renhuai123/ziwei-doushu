/**
 * Script quét tìm các ký tự Trung Quốc trong codebase
 * Usage: npx tsx scripts/find-chinese.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Regex phát hiện ký tự Trung Quốc
const CHINESE_REGEX = /[\u4e00-\u9fff]/;

// Các thư mục/file cần bỏ qua
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  '.translation-cache',
  'logs',
];

const EXCLUDE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'tsconfig.tsbuildinfo',
];

const EXCLUDE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
];

interface ChineseCharFound {
  filePath: string;
  lineNumber: number;
  line: string;
  chineseChars: string[];
}

/**
 * Kiểm tra xem path có nên bỏ qua không
 */
function shouldExclude(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Check excluded directories
  for (const dir of EXCLUDE_DIRS) {
    if (normalizedPath.includes(`/${dir}/`) || normalizedPath.startsWith(`${dir}/`)) {
      return true;
    }
  }
  
  // Check excluded files
  const fileName = path.basename(filePath);
  if (EXCLUDE_FILES.includes(fileName)) {
    return true;
  }
  
  // Check excluded extensions
  const ext = path.extname(filePath).toLowerCase();
  if (EXCLUDE_EXTENSIONS.includes(ext)) {
    return true;
  }
  
  return false;
}

/**
 * Tìm tất cả ký tự Trung Quốc trong một file
 */
function findChineseInFile(filePath: string): ChineseCharFound[] {
  const results: ChineseCharFound[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (CHINESE_REGEX.test(line)) {
        // Extract all Chinese chars
        const matches = line.match(/[\u4e00-\u9fff]+/g);
        if (matches) {
          const chars = matches.flatMap(m => m.split(''));
          results.push({
            filePath,
            lineNumber: i + 1,
            line: line.trim().substring(0, 150), // Giới hạn độ dài
            chineseChars: [...new Set(chars)], // Unique chars
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Không thể đọc file ${filePath}:`, error);
  }
  
  return results;
}

/**
 * Quét đệ quy một thư mục
 */
function scanDirectory(dirPath: string, results: ChineseCharFound[] = []): ChineseCharFound[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (shouldExclude(fullPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath, results);
      } else if (entry.isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        // Chỉ quét file text
        if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.css', '.scss'].includes(ext)) {
          const fileResults = findChineseInFile(fullPath);
          results.push(...fileResults);
        }
      }
    }
  } catch (error) {
    console.error(`Lỗi khi quét thư mục ${dirPath}:`, error);
  }
  
  return results;
}

/**
 * Format output cho dễ đọc
 */
function formatOutput(results: ChineseCharFound[], groupByFile: boolean = true): string {
  if (results.length === 0) {
    return '✅ Không tìm thấy ký tự Trung Quốc nào!';
  }
  
  let output = `🔍 Tìm thấy ${results.length} dòng chứa ký tự Trung Quốc:\n\n`;
  
  if (groupByFile) {
    // Group by file
    const byFile = new Map<string, ChineseCharFound[]>();
    for (const result of results) {
      if (!byFile.has(result.filePath)) {
        byFile.set(result.filePath, []);
      }
      byFile.get(result.filePath)!.push(result);
    }
    
    for (const [filePath, fileResults] of byFile.entries()) {
      output += `\n📁 ${filePath}\n`;
      output += `${'─'.repeat(60)}\n`;
      
      for (const r of fileResults.slice(0, 10)) { // Giới hạn 10 dòng đầu mỗi file
        output += `  Line ${r.lineNumber}: ${r.line}\n`;
        output += `    Chars: ${r.chineseChars.join(', ')}\n`;
      }
      
      if (fileResults.length > 10) {
        output += `  ... và ${fileResults.length - 10} dòng khác\n`;
      }
    }
  } else {
    // List all
    for (const r of results.slice(0, 50)) { // Giới hạn 50 dòng total
      output += `${r.filePath}:${r.lineNumber}\n`;
      output += `  ${r.line}\n`;
      output += `  Chars: ${r.chineseChars.join(', ')}\n\n`;
    }
    
    if (results.length > 50) {
      output += `\n... và ${results.length - 50} dòng khác\n`;
    }
  }
  
  return output;
}

/**
 * Generate summary statistics
 */
function generateStats(results: ChineseCharFound[]): string {
  const byFile = new Map<string, number>();
  const allChars = new Set<string>();
  
  for (const r of results) {
    byFile.set(r.filePath, (byFile.get(r.filePath) || 0) + 1);
    r.chineseChars.forEach(c => allChars.add(c));
  }
  
  const topFiles = Array.from(byFile.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  let stats = '\n📊 Thống kê:\n';
  stats += `${'═'.repeat(60)}\n`;
  stats += `Tổng số dòng chứa ký tự Trung: ${results.length}\n`;
  stats += `Tổng số file có ký tự Trung: ${byFile.size}\n`;
  stats += `Số ký tự Trung unique: ${allChars.size}\n\n`;
  
  if (topFiles.length > 0) {
    stats += 'Top 10 file nhiều ký tự Trung nhất:\n';
    for (const [file, count] of topFiles) {
      stats += `  ${count.toString().padStart(4)} dòng: ${file}\n`;
    }
  }
  
  return stats;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const outputArg = args.indexOf('--output');
  const groupByFile = !args.includes('--no-group');
  const targetDir = args.find(arg => !arg.startsWith('-')) || '.';
  
  console.log(`🔍 Đang quét thư mục: ${targetDir}`);
  console.log('Bỏ qua: node_modules, .next, dist, build, .git, ...\n');
  
  const startTime = Date.now();
  const results = scanDirectory(path.resolve(targetDir));
  const elapsedMs = Date.now() - startTime;
  
  // Output
  const output = formatOutput(results, groupByFile) + generateStats(results);
  
  if (outputArg !== -1 && outputArg < args.length - 1) {
    const outputFile = args[outputArg + 1];
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFile, output, 'utf-8');
    console.log(`Đã ghi kết quả vào ${outputFile}`);
  } else {
    console.log(output);
  }
  
  console.log(`\n⏱️ Thời gian quét: ${elapsedMs}ms`);
  
  // Exit code
  process.exit(results.length > 0 ? 1 : 0);
}

main();
