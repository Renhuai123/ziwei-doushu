#!/usr/bin/env node
/**
 * Splits the v4.0 interpretation dataset (data/v4/year-YYYY.jsonl.zst) into
 * month shards (data/v4/shards/YYYY/MM.jsonl.zst) so one lookup decompresses
 * ~23 MB instead of a whole ~280 MB year.
 *
 * Usage: node scripts/readings/build-shards.mjs [--jobs N] [years...]
 * Idempotent: a year whose 12 shards already exist is skipped; shards are
 * written to a .tmp file and renamed, so an interrupted run leaves no partial shard.
 */
import { createReadStream, existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fork } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { availableParallelism } from 'node:os';
import { constants, createZstdDecompress, zstdCompressSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'data', 'v4');
const OUT = join(SRC, 'shards');
const WINDOW_LOG = 27;

const shardDir = (year) => join(OUT, String(year));
const isDone = (year) => existsSync(shardDir(year)) && readdirSync(shardDir(year)).filter(f => f.endsWith('.jsonl.zst')).length === 12;

async function buildYear(year) {
  const input = createReadStream(join(SRC, `year-${year}.jsonl.zst`))
    .pipe(createZstdDecompress({ params: { [constants.ZSTD_d_windowLogMax]: WINDOW_LOG } }));
  mkdirSync(shardDir(year), { recursive: true });
  const written = new Set();
  const flush = (month, lines) => {
    if (written.has(month)) throw new Error(`year ${year}: month ${month} is not contiguous in the source`);
    const buf = zstdCompressSync(Buffer.from(lines.join('\n') + '\n'), {
      params: { [constants.ZSTD_c_compressionLevel]: 19, [constants.ZSTD_c_windowLog]: WINDOW_LOG },
    });
    const target = join(shardDir(year), `${month}.jsonl.zst`);
    writeFileSync(`${target}.tmp`, buf);
    renameSync(`${target}.tmp`, target);
    written.add(month);
  };
  // The source is sorted by date, so only the current month is held in memory.
  let current = null;
  let lines = [];
  for await (const line of createInterface({ input, crlfDelay: Infinity })) {
    if (!line) continue;
    const month = line.slice(11, 13);
    if (!/^\d\d$/.test(month)) throw new Error(`year ${year}: unexpected line start ${line.slice(0, 40)}`);
    if (month !== current) {
      if (current !== null) flush(current, lines);
      current = month;
      lines = [];
    }
    lines.push(line);
  }
  if (current !== null) flush(current, lines);
  if (written.size !== 12) throw new Error(`year ${year}: expected 12 months, got ${written.size}`);
}

if (process.env.BUILD_SHARD_YEAR) {
  await buildYear(Number(process.env.BUILD_SHARD_YEAR));
  process.exit(0);
}

const args = process.argv.slice(2);
const jobsIdx = args.indexOf('--jobs');
const jobs = jobsIdx >= 0 ? Number(args.splice(jobsIdx, 2)[1]) : Math.max(1, availableParallelism() - 2);
const allYears = readdirSync(SRC).map(f => f.match(/^year-(\d{4})\.jsonl\.zst$/)?.[1]).filter(Boolean).map(Number).sort();
const years = (args.length ? args.map(Number) : allYears).filter(y => !isDone(y));
console.log(`building ${years.length} years with ${jobs} jobs`);

const queue = [...years];
let failed = 0;
await Promise.all(Array.from({ length: jobs }, async () => {
  for (let year = queue.shift(); year !== undefined; year = queue.shift()) {
    const t0 = Date.now();
    const code = await new Promise(res => fork(fileURLToPath(import.meta.url), [], { env: { ...process.env, BUILD_SHARD_YEAR: String(year) } }).on('exit', res));
    if (code !== 0) failed++;
    console.log(`${year} ${code === 0 ? 'ok' : `FAILED (${code})`} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}));
console.log(failed ? `${failed} years failed` : 'all years done');
process.exit(failed ? 1 : 0);
