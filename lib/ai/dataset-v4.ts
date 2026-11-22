/**
 * Tra dataset luận giải v4.0 (674.976 lá số × 13 chủ đề, chữ Hán) theo khóa lá số.
 *
 * Dữ liệu: data/dataset-v4/year-YYYY.jsonl.zst (77 file theo năm 1950–2026, mỗi file ~2 MB nén,
 * ~700 MB giải nén). Không giải nén ra đĩa: đọc luồng zstd, so khớp đầu dòng với khóa, gặp là dừng.
 * Lần đầu tra một lá số mất ~1–5 giây (tùy vị trí trong năm); dòng tìm được lưu ở
 * data/dataset-v4/cache/<khóa>.json và trong bộ nhớ, các lần sau gần như tức thì.
 *
 * Năm chưa có file: bỏ qua (trả về null), trừ khi đặt DATASET_V4_AUTO_DOWNLOAD=1 thì tự tải
 * file năm đó từ GitHub Release (công khai) rồi kiểm SHA256 trước khi dùng.
 *
 * Lưu ý độ khớp: dataset lập lá số theo ngày dương + số thứ tự giờ (không hiệu chỉnh giờ mặt trời),
 * độ sáng sao theo trường phái cũ "hiện đại hiệu chỉnh v2". Khóa dùng birthInfo của lá số (ngày đã
 * qua xử lý giờ Tý muộn = đúng đầu vào của engine), nên sao/cung trùng; chỉ chữ độ sáng có thể khác.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import readline from 'node:readline';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const DATASET_DIMS = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
] as const;
export type DatasetDim = typeof DATASET_DIMS[number];

export interface DatasetRow {
  k: string;
  ms: string | null;
  c: Record<DatasetDim, string>;
}

const DIR = path.join(process.cwd(), 'data/dataset-v4');
const CACHE_DIR = path.join(DIR, 'cache');
const RELEASE = 'https://github.com/Renhuai123/ziwei-doushu/releases/download/v4.0-13d';
const MEMORY_LIMIT = 200;

const memory = new Map<string, DatasetRow | null>();
const inflight = new Map<string, Promise<LookupResult>>();
const downloads = new Map<number, Promise<boolean>>();

export function datasetKey(chart: ZiweiChart): string | null {
  const { year, month, day, hour, gender } = chart.birthInfo;
  if (year < 1950 || year > 2026) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${year}-${p(month)}-${p(day)}-${hour}-${gender}`;
}

function remember(k: string, row: DatasetRow | null) {
  memory.set(k, row);
  if (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value!);
}

async function ensureYearFile(year: number): Promise<boolean> {
  const file = path.join(DIR, `year-${year}.jsonl.zst`);
  if (fs.existsSync(file)) return true;
  if (process.env.DATASET_V4_AUTO_DOWNLOAD !== '1') return false;
  let job = downloads.get(year);
  if (!job) {
    job = (async () => {
      try {
        const name = `year-${year}.jsonl.zst`;
        const [data, sums] = await Promise.all([
          fetch(`${RELEASE}/${name}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); }),
          fetch(`${RELEASE}/SHA256SUMS.txt`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); }),
        ]);
        const expected = sums.split('\n').find(l => l.trim().endsWith(name))?.split(/\s+/)[0];
        const actual = crypto.createHash('sha256').update(Buffer.from(data)).digest('hex');
        if (!expected || expected !== actual) throw new Error('SHA256 không khớp');
        fs.mkdirSync(DIR, { recursive: true });
        fs.writeFileSync(`${file}.part`, Buffer.from(data));
        fs.renameSync(`${file}.part`, file);
        return true;
      } catch (err) {
        console.error(`[dataset-v4] không tải được năm ${year}:`, err);
        return false;
      } finally {
        downloads.delete(year);
      }
    })();
    downloads.set(year, job);
  }
  return job;
}

// zstd có trong zlib từ Node 22.15 / 23.8, nhưng @types/node của dự án cũ hơn nên khai báo kiểu tại đây.
type ZstdZlib = typeof zlib & {
  createZstdDecompress?: (opts: { params: Record<number, number> }) => NodeJS.ReadWriteStream;
  constants: typeof zlib.constants & { ZSTD_d_windowLogMax?: number };
};

function zstdDecompress(): NodeJS.ReadWriteStream {
  const z = zlib as ZstdZlib;
  if (!z.createZstdDecompress || z.constants.ZSTD_d_windowLogMax === undefined) {
    throw new Error(`Node ${process.version} không hỗ trợ zstd (cần Node ≥ 22.15)`);
  }
  // File nén bằng --long=27 → phải cho phép cửa sổ 2^27.
  return z.createZstdDecompress({ params: { [z.constants.ZSTD_d_windowLogMax]: 27 } });
}

function scan(file: string, k: string): Promise<DatasetRow | null> {
  return new Promise((resolve, reject) => {
    const src = fs.createReadStream(file);
    const z = zstdDecompress();
    const lines = readline.createInterface({ input: src.pipe(z), crlfDelay: Infinity });
    const prefix = `{"k":"${k}"`;
    let found: DatasetRow | null = null;
    const stop = () => { lines.close(); src.destroy(); (z as unknown as { destroy(): void }).destroy(); };
    lines.on('line', line => {
      if (found || !line.startsWith(prefix)) return;
      found = JSON.parse(line) as DatasetRow;
      stop();
    });
    lines.on('close', () => resolve(found));
    z.on('error', (err: Error) => { if (!found) reject(err); });
    src.on('error', reject);
  });
}

/** Dòng được lấy từ đâu — ghi vào trace. */
export type LookupSource =
  | 'memory' | 'disk-cache' | 'scan' | 'download+scan'
  | 'out-of-range' | 'no-year-file' | 'not-found' | 'error';

export interface LookupResult { key: string | null; row: DatasetRow | null; source: LookupSource }

/** Trả về dòng dataset của lá số kèm nguồn; row = null nếu ngoài phạm vi / chưa có file năm. Không bao giờ ném lỗi. */
export async function lookupDataset(chart: ZiweiChart): Promise<LookupResult> {
  const k = datasetKey(chart);
  if (!k) return { key: null, row: null, source: 'out-of-range' };
  if (memory.has(k)) {
    const row = memory.get(k)!;
    return { key: k, row, source: row ? 'memory' : 'not-found' };
  }

  const cacheFile = path.join(CACHE_DIR, `${k}.json`);
  try {
    const row = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as DatasetRow;
    remember(k, row);
    return { key: k, row, source: 'disk-cache' };
  } catch { /* chưa có cache */ }

  let job = inflight.get(k);
  if (!job) {
    job = (async (): Promise<LookupResult> => {
      try {
        const year = chart.birthInfo.year;
        const hadFile = fs.existsSync(path.join(DIR, `year-${year}.jsonl.zst`));
        // không cache kết quả "chưa có file": có thể tải file năm đó sau
        if (!(await ensureYearFile(year))) return { key: k, row: null, source: 'no-year-file' };
        const row = await scan(path.join(DIR, `year-${year}.jsonl.zst`), k);
        if (row) {
          fs.mkdirSync(CACHE_DIR, { recursive: true });
          fs.writeFileSync(cacheFile, JSON.stringify(row));
        }
        remember(k, row);
        return { key: k, row, source: row ? (hadFile ? 'scan' : 'download+scan') : 'not-found' };
      } catch (err) {
        console.error('[dataset-v4] lỗi tra cứu', k, err);
        return { key: k, row: null, source: 'error' };
      } finally {
        inflight.delete(k);
      }
    })();
    inflight.set(k, job);
  }
  return job;
}
