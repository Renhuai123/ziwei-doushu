/**
 * Checks that the v4.0 dataset was charted the same way this engine charts:
 * for every record in one month shard, the first major star of the engine's
 * Life Palace must equal the record's `ms`.
 *
 * Usage: npx tsx scripts/readings/check-alignment.ts [year] [month]
 */
import { readFileSync } from 'node:fs';
import { zstdDecompressSync, constants } from 'node:zlib';
import { generateChart } from '../../lib/ziwei/algorithm';

const [year = '1990', month = '06'] = process.argv.slice(2);
const raw = zstdDecompressSync(
  readFileSync(`data/v4/shards/${year}/${month}.jsonl.zst`),
  { params: { [constants.ZSTD_d_windowLogMax]: 27 } },
).toString('utf8');

let checked = 0;
let mismatched = 0;
for (const line of raw.split('\n')) {
  if (!line) continue;
  const r = JSON.parse(line) as { k: string; y: number; m: number; d: number; h: number; g: 'male' | 'female'; ms: string | null };
  const chart = generateChart({ year: r.y, month: r.m, day: r.d, hour: r.h, gender: r.g });
  const ming = chart.palaces.find(p => p.isMingGong);
  const first = ming?.stars.find(s => s.type === 'major')?.name ?? null;
  checked++;
  if (first !== r.ms) {
    mismatched++;
    if (mismatched <= 5) console.log('mismatch', r.k, 'dataset', r.ms, 'engine', first);
  }
}
console.log(`checked ${checked}, mismatched ${mismatched}`);
process.exit(mismatched ? 1 : 0);
