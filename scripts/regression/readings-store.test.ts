import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TOPIC_LABEL } from '../../lib/ziwei/db-analysis';

const shardsDir = process.env.READINGS_DIR ?? join(process.cwd(), 'data', 'v4', 'shards');

async function main() {
  const { findReading, readingKey } = await import('../../lib/readings/store');
  const info = { year: 1990, month: 1, day: 1, hour: 0, gender: 'male' } as const;

  assert.equal(readingKey(info), '1990-01-01-0-male');
  assert.equal(readingKey({ ...info, month: 12, day: 31, hour: 11, gender: 'female' }), '1990-12-31-11-female');

  const old = await findReading({ ...info, year: 1949 });
  assert.equal(old.status, 'out-of-range');

  process.env.READINGS_DIR = mkdtempSync(join(tmpdir(), 'readings-empty-'));
  assert.equal((await findReading(info)).status, 'unavailable');

  if (existsSync(join(shardsDir, '1990', '01.jsonl.zst'))) {
    process.env.READINGS_DIR = shardsDir;
    const r = await findReading(info);
    assert.equal(r.status, 'found');
    if (r.status === 'found') {
      assert.equal(r.reading.key, '1990-01-01-0-male');
      assert.equal(r.reading.mainStar, '天府');
      for (const k of Object.keys(TOPIC_LABEL)) {
        assert.ok(r.reading.topics[k as keyof typeof TOPIC_LABEL]?.length > 0, `${k} is non-empty`);
      }
    }
    const absent = await findReading({ ...info, day: 31, month: 2 });
    assert.equal(absent.status, 'unavailable', 'a key absent from an existing shard is not found');
  } else {
    console.log(`SKIP found case: no shard at ${shardsDir}`);
  }
  console.log('readings store regression passed');
}

main();
