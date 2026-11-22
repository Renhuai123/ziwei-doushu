/**
 * 生成分享预览图用的中文字体子集：npm run og:font
 * 需要本机有 Noto Sans CJK（Debian/Ubuntu：apt install fonts-noto-cjk）和 fonttools（pip install fonttools）。
 * Noto Sans CJK 采用 SIL Open Font License 1.1，子集可随仓库分发。
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allOgText } from '../lib/og/text';

const SRC_DIR = process.env.NOTO_CJK_DIR ?? '/usr/share/fonts/opentype/noto';
const SC_INDEX = '2'; // NotoSansCJK-*.ttc 里第 3 个字面是 SC（简体）
const OUT_DIR = join(process.cwd(), 'lib/og/fonts');

const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const chars = [...new Set(allOgText() + ascii + '·×《》：')].join('');
const textFile = join(mkdtempSync(join(tmpdir(), 'og-font-')), 'chars.txt');
writeFileSync(textFile, chars);
// 记下子集覆盖的字符，回归测试据此检查预览图文字没有超出字体
writeFileSync(join(OUT_DIR, 'chars.txt'), chars + '\n');

for (const weight of ['Regular', 'Bold']) {
  execFileSync(process.env.PYFTSUBSET ?? 'pyftsubset', [
    join(SRC_DIR, `NotoSansCJK-${weight}.ttc`),
    `--font-number=${SC_INDEX}`,
    `--text-file=${textFile}`,
    '--layout-features=*',
    '--no-hinting',
    `--output-file=${join(OUT_DIR, `NotoSansSC-${weight}.subset.otf`)}`,
  ], { stdio: 'inherit' });
}
console.log(`✓ ${[...chars].length} 个字符 → lib/og/fonts/NotoSansSC-{Regular,Bold}.subset.otf`);
