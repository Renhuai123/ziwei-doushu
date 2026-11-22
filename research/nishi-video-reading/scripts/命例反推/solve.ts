/**
 * 用叠图露出的宫位格反推命例生辰，还原整张盘。
 * 用法（在 ziwei-3.0 目录）：npx tsx <本文件> <命例组.json> <输出.json>
 *
 * 约束：宫名 → 命宫地支；宫干 → 年干（五虎遁，两种可能）；主星 → 生日（同局下主星只由日子决定）；
 * 其余星曜、大限岁数 → 年支、月、时、性别。年份范围 1900–2010（倪师命例是真人）。
 * 评分只比星名（各家亮度表不同，不比亮度）+ 大限起止岁数；全部露出的星名都对上才算唯一解。
 */
import fs from 'node:fs';
import path from 'node:path';

// 排盘引擎所在目录（开源排盘引擎 github.com/Renhuai123/ziwei-doushu 的 lib/ziwei 同口径）
const root = process.env.ZIWEI_ROOT || path.resolve('ziwei-doushu');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateChart } = require(path.join(root, 'lib/ziwei/algorithm'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Lunar } = require(path.join(root, 'node_modules/lunar-javascript'));

const GAN = '甲乙丙丁戊己庚辛壬癸';
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const ORDER = ['命', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
const YIN_STEM: Record<number, number[]> = { 2: [0, 5], 4: [1, 6], 6: [2, 7], 8: [3, 8], 0: [4, 9] }; // 寅宫干 → 年干

type Cell = { 宫: string; 干: string | null; 支: string; 主星: string[]; 内容: string[]; 大限: string | null };
type Group = { 命例: string; 集: string; 起秒: number; 止秒: number; 格: Cell[]; 来源: string[] };

const [, , inFile, outFile] = process.argv;
const groups: Group[] = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const VOCAB = new Set<string>();

function chartOf(y: number, m: number, d: number, hour: number, gender: 'male' | 'female') {
  let s;
  try { s = Lunar.fromYmd(y, m, d).getSolar(); } catch { return null; }
  try { return generateChart({ year: s.getYear(), month: s.getMonth(), day: s.getDay(), hour, gender }); } catch { return null; }
}

// 先收集引擎里出现的全部星名，作为识别叠图里「星名」的词表
for (let d = 1; d <= 30; d += 3) for (let h = 0; h < 12; h += 4) {
  const c = chartOf(1961, 3, d, h, 'female');
  c?.palaces.forEach((p: any) => p.stars.forEach((s: any) => VOCAB.add(s.name)));
}

function observedStars(cell: Cell): string[] {
  const out: string[] = [];
  for (const t of cell.内容) for (const v of VOCAB) if (t.startsWith(v)) { out.push(v); break; }
  return out;
}

function score(c: any, g: Group, mingBr: number) {
  let hit = 0, tot = 0, dxHit = 0, dxTot = 0;
  for (const cell of g.格) {
    const br = ZHI.indexOf(cell.支);
    const p = c.palaces.find((x: any) => x.branch === br);
    if (!p) continue;
    const names = new Set(p.stars.map((s: any) => s.name));
    for (const s of observedStars(cell)) { tot++; if (names.has(s)) hit++; }
    if (cell.大限) {
      dxTot++;
      const [a, b] = cell.大限.split('~').map(Number);
      if (p.daXianAge && p.daXianAge[0] === a && p.daXianAge[1] === b) dxHit++;
    }
  }
  return { hit, tot, dxHit, dxTot, ok: c.mingGongBranch === mingBr };
}

const results: any[] = [];
for (const g of groups) {
  const t0 = Date.now();
  // 命宫地支
  const brs = new Set<number>();
  for (const cell of g.格) {
    const i = ORDER.indexOf(cell.宫);
    if (i >= 0) brs.add(((ZHI.indexOf(cell.支) + i) % 12 + 12) % 12);
  }
  if (brs.size !== 1) { results.push({ 命例: g.命例, 结论: '宫名与地支自相矛盾，可能混了两个命例', 命宫候选: [...brs].map((b) => ZHI[b]) }); continue; }
  const mingBr = [...brs][0];
  // 年干
  const stems = new Set<number>();
  for (const cell of g.格) if (cell.干) {
    const br = ZHI.indexOf(cell.支), st = GAN.indexOf(cell.干);
    const yin = (((st - ((br - 2 + 12) % 12)) % 10) + 10) % 10;
    (YIN_STEM[yin] || []).forEach((x) => stems.add(x));
  }
  const years: number[] = [];
  for (let y = 1900; y <= 2010; y++) if (!stems.size || stems.has((y - 4 + 600) % 10)) years.push(y);
  // 主星只由「局 + 日」决定：先用任意一个年/月定出可能的日子
  const majorWant = g.格.filter((c) => c.主星.length);
  const days: number[] = [];
  const y0 = years[0], m0 = 1, h0 = ((2 + (m0 - 1) - mingBr) % 12 + 12) % 12;
  for (let d = 1; d <= 30; d++) {
    const c = chartOf(y0, m0, d, h0, 'female');
    if (!c) continue;
    const okAll = majorWant.every((cell) => {
      const p = c.palaces.find((x: any) => x.branch === ZHI.indexOf(cell.支));
      const got = p.stars.filter((s: any) => s.type === 'major').map((s: any) => s.name).sort().join();
      return got === [...cell.主星].sort().join();
    });
    if (okAll) days.push(d);
  }
  const cands: any[] = [];
  for (const y of years) for (let m = 1; m <= 12; m++) {
    const h = ((2 + (m - 1) - mingBr) % 12 + 12) % 12;
    for (const d of days) for (const gender of ['female', 'male'] as const) {
      const c = chartOf(y, m, d, h, gender);
      if (!c) continue;
      const s = score(c, g, mingBr);
      if (!s.ok) continue;
      cands.push({ 农历: `${y}年${m}月${d}日`, 时辰: ZHI[h] + '时', 性别: gender === 'female' ? '女' : '男', ...s, 分: (s.hit / Math.max(s.tot, 1)) + (s.dxTot ? s.dxHit / s.dxTot : 0) });
    }
  }
  cands.sort((a, b) => b.分 - a.分);
  const best = cands[0];
  const ties = best ? cands.filter((c) => c.分 === best.分) : [];
  let full = null;
  if (best && ties.length === 1) {
    const [yy, mm, dd] = best.农历.match(/\d+/g).map(Number);
    const c = chartOf(yy, mm, dd, ZHI.indexOf(best.时辰[0]), best.性别 === '女' ? 'female' : 'male');
    full = c.palaces.map((p: any) => ({ 宫: p.name, 干支: GAN[p.stem] + ZHI[p.branch], 大限: p.daXianAge, 星: p.stars.map((s: any) => s.name + (s.siHua || '')) }));
  }
  const rec = {
    命例: g.命例, 集: g.集, 起秒: g.起秒, 止秒: g.止秒, 露出宫数: g.格.length, 命宫: ZHI[mingBr], 年干候选: [...stems].map((x) => GAN[x]).join(''),
    主星定出的日子: days, 候选数: cands.length, 最优: best, 并列最优数: ties.length,
    并列样例: ties.slice(0, 5).map((t) => `${t.农历}${t.时辰}${t.性别}`), 整盘: full, 用时毫秒: Date.now() - t0,
  };
  results.push(rec);
  fs.appendFileSync(outFile + 'l', JSON.stringify(rec) + '\n');  // 逐个落盘（.jsonl），防中途被掐
  console.log(g.命例, '露出', g.格.length, '宫', '日子', days.join(','), '候选', cands.length, '最优', best ? `${best.农历}${best.时辰}${best.性别} 星${best.hit}/${best.tot} 大限${best.dxHit}/${best.dxTot}` : '无', '并列', ties.length);
}
fs.writeFileSync(outFile, JSON.stringify(results, null, 1));
