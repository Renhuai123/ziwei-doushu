#!/usr/bin/env node
/**
 * 并行跑 scripts/regression/ 下所有 *.test.ts / *.test.tsx，每个文件一个独立进程（与逐个 `tsx 文件` 等价）。
 *
 *   npm test                 全部
 *   npm test -- patterns     只跑文件名包含 patterns 的
 *   TEST_JOBS=1 npm test     逐个跑（排查并发问题时用）
 *
 * 上次各文件的耗时记在 node_modules/.cache/regression-times.json，下次最慢的先开跑，
 * 总时长就接近最慢的那一个文件，而不是被它拖在最后。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'scripts', 'regression');
const timesFile = join(root, 'node_modules', '.cache', 'regression-times.json');

const filters = process.argv.slice(2);
const all = readdirSync(dir).filter(f => /\.test\.tsx?$/.test(f));
const files = all.filter(f => filters.length === 0 || filters.some(q => f.includes(q)));
if (files.length === 0) {
  console.error(`没有匹配的测试文件：${filters.join(' ')}`);
  process.exit(1);
}

let times = {};
try { times = JSON.parse(readFileSync(timesFile, 'utf8')); } catch { /* 第一次运行没有记录 */ }
files.sort((a, b) => (times[b] ?? 0) - (times[a] ?? 0) || a.localeCompare(b));

const jobs = Math.max(1, Number(process.env.TEST_JOBS) || availableParallelism());
const started = Date.now();
const failed = [];
let next = 0;

function run(file) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const child = spawn(process.execPath, ['--import', 'tsx', join(dir, file)], {
      cwd: root,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', d => { output += d; });
    child.stderr.on('data', d => { output += d; });
    child.on('close', (code, signal) => {
      const seconds = (Date.now() - t0) / 1000;
      times[file] = seconds;
      const ok = code === 0;
      console.log(`${ok ? '✓' : '✗'} ${file} (${seconds.toFixed(1)}s)`);
      if (!ok) {
        failed.push(file);
        console.log(`──── ${file} 输出${signal ? `（被 ${signal} 终止）` : `（退出码 ${code}）`} ────\n${output.trimEnd()}\n────`);
      }
      resolve();
    });
  });
}

async function worker() {
  while (next < files.length) await run(files[next++]);
}

await Promise.all(Array.from({ length: Math.min(jobs, files.length) }, worker));

try {
  mkdirSync(dirname(timesFile), { recursive: true });
  // 只留现存测试文件的记录，删掉的文件不再占位
  writeFileSync(timesFile, JSON.stringify(Object.fromEntries(all.filter(f => f in times).map(f => [f, times[f]])), null, 2));
} catch { /* 写不进缓存不影响结果 */ }

const wall = ((Date.now() - started) / 1000).toFixed(1);
if (failed.length) {
  console.log(`\n${failed.length} 个失败（共 ${files.length} 个，${jobs} 路并行，${wall}s）：\n  ${failed.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n全部 ${files.length} 个通过（${jobs} 路并行，${wall}s）`);
