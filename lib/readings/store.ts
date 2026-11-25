import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
import type { BirthInfo } from '@/lib/ziwei/types';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import { READINGS_YEAR_RANGE, type ChartReading, type ReadingResult } from './types';

// @types/node here predates the Node 24 zstd API, so type the two members we use.
const zstd = zlib as unknown as {
  zstdDecompress(buf: Buffer, opts: object, cb: (err: Error | null, out: Buffer) => void): void;
  constants: { ZSTD_d_windowLogMax: number };
};
const decompress = promisify(zstd.zstdDecompress) as (buf: Buffer, opts: object) => Promise<Buffer>;
const WINDOW_LOG = 27;
const MAX_CACHED_MONTHS = 2;

type Birth = Pick<BirthInfo, 'year' | 'month' | 'day' | 'hour' | 'gender'>;

export function readingKey({ year, month, day, hour, gender }: Birth): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${year}-${p(month)}-${p(day)}-${hour}-${gender}`;
}

const shardDir = () => process.env.READINGS_DIR ?? join(process.cwd(), 'data', 'v4', 'shards');

// Cached promises so concurrent requests share one decompression; null = shard file missing.
const months = new Map<string, Promise<string | null>>();

async function loadMonth(year: number, month: number): Promise<string | null> {
  const file = join(shardDir(), String(year), `${String(month).padStart(2, '0')}.jsonl.zst`);
  let buf: Buffer;
  try {
    buf = await readFile(file);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
  const raw = await decompress(buf, { params: { [zstd.constants.ZSTD_d_windowLogMax]: WINDOW_LOG } });
  return raw.toString('utf8');
}

function getMonth(year: number, month: number): Promise<string | null> {
  const id = `${shardDir()}|${year}-${month}`;
  const hit = months.get(id);
  if (hit) {
    months.delete(id);
    months.set(id, hit);
    return hit;
  }
  const p = loadMonth(year, month);
  months.set(id, p);
  p.then(
    (text) => { if (text === null) months.delete(id); },
    () => months.delete(id),
  );
  while (months.size > MAX_CACHED_MONTHS) {
    months.delete(months.keys().next().value as string);
  }
  return p;
}

export async function findReading(info: Birth): Promise<ReadingResult> {
  const [min, max] = READINGS_YEAR_RANGE;
  if (info.year < min || info.year > max) return { status: 'out-of-range', range: READINGS_YEAR_RANGE };
  const text = await getMonth(info.year, info.month);
  if (text === null) return { status: 'unavailable' };
  const key = readingKey(info);
  const prefix = `{"k":"${key}"`;
  const start = text.startsWith(prefix) ? 0 : text.indexOf(`\n${prefix}`) + 1;
  if (start === 0 && !text.startsWith(prefix)) return { status: 'unavailable' };
  const end = text.indexOf('\n', start);
  const row = JSON.parse(text.slice(start, end === -1 ? undefined : end)) as {
    k: string; ms?: string | null; c: Record<TopicKey, string>;
  };
  const reading: ChartReading = { key: row.k, mainStar: row.ms ?? null, topics: row.c };
  return { status: 'found', reading };
}
