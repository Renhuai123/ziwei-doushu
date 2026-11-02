/**
 * 2026-10-20 起：本仓库不出现任何第三方排盘软件的名称或拼音（含对方程序符号），保持中立表述。
 *   扫描全部已跟踪的文本文件；关键字用 Unicode 转义写，本文件自身不含原字。
 *   允许：《紫微斗数全书》与白话里「文章笔墨」义的成语（如「…精通」「主掌…」「纯靠…」「落在…上」）。
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const NAME = '\u6587\u58a8'; // 两个汉字的品牌简称
const BANNED: RegExp[] = [
  new RegExp(NAME),
  /w\u0065nmo/i,
  /w\u0065n[\s_-]?mo[\s_-]?tian/i,
];
const IDIOMS = new RegExp(`${NAME}(\u7cbe\u901a|\u4e4b\u795e|\u4e4b\u661f)|\u4e3b\u638c${NAME}|\u7eaf\u9760${NAME}|\u843d\u5728${NAME}`, 'g');

const TEXT_EXT = /\.(ts|tsx|js|mjs|cjs|json|css|md|txt|html|svg|xml|yml|yaml)$/i;

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter((f) => f && TEXT_EXT.test(f));
const hits: string[] = [];
for (const f of files) {
  if (BANNED.some((re) => re.test(f))) { hits.push(`${f}（文件名）`); continue; }
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const cleaned = line.replace(IDIOMS, '');
    if (BANNED.some((re) => re.test(cleaned))) hits.push(`${f}:${i + 1}  ${line.trim().slice(0, 80)}`);
  });
}

if (hits.length) {
  console.error(`✗ 发现 ${hits.length} 处第三方排盘软件的名称 / 拼音（本仓库保持中立表述）：`);
  for (const h of hits.slice(0, 40)) console.error('  ' + h);
  process.exit(1);
}
console.log(`[neutral-naming] ${files.length} 个文件检查通过：没有第三方排盘软件的名称与拼音`);
