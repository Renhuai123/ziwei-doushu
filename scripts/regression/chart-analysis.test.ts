import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Next aliases the server-only marker during bundling. Reproduce its server
// resolution for this direct action test without changing application code.
if (process.argv[2] !== '--child') {
  const result = spawnSync(process.execPath, ['--conditions=react-server', '--import', 'tsx', __filename, '--child'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_PATH: path.resolve('node_modules/next/dist/compiled') },
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

async function run() {
  const { getChartAnalysis } = await import('../../app/chart/actions');
  const birthInfo = { year: 1990, month: 6, day: 15, hour: 6, gender: 'male' as const };
  const actual = await getChartAnalysis({ birthInfo });
  const forged = { birthInfo, palaces: [], mingGongBranch: -99, daXians: [] };
  assert.deepEqual(await getChartAnalysis(forged), actual, 'untrusted chart fields cannot change the analysis');
  assert.ok(actual.summary.stars.length > 0, 'a valid birth produces a real summary');
  await assert.rejects(() => getChartAnalysis({ birthInfo: { ...birthInfo, day: 31, month: 2 } }));
  console.log('chart analysis input: passed');
}

void run().catch(error => { console.error(error); process.exitCode = 1; });
