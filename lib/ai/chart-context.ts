/**
 * 命盘 → 给大模型读的中文文本。
 *
 * 只输出排盘引擎算好的结构化事实（宫位、星曜、亮度、四化、大限、流年、格局），
 * 不做任何断语——解读交给模型，事实以这里为准，模型不需要也不应该自己重新安星。
 */
import type { Palace, Star, ZiweiChart } from '../ziwei/types';
import { BRANCHES, STEMS } from '../ziwei/constants';
import { detectPatterns } from '../ziwei/patterns';
import { getLiuNianSiHua, getYearBranchIndex } from '../ziwei/sihua';

const PALACE_ORDER = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
const TYPE_LABEL: Record<Star['type'], string> = { major: '主星', lucky: '吉星', sha: '煞星', minor: '杂耀' };
const LEVEL_LABEL = { excellent: '上格', good: '吉格', neutral: '中性', caution: '需注意' } as const;

function gz(stem: number, branch: number): string {
  return `${STEMS[stem] ?? ''}${BRANCHES[branch] ?? ''}`;
}

function starText(s: Star): string {
  return `${s.name}${s.brightnessRaw ? `(${s.brightnessRaw})` : ''}${s.siHua ? `化${s.siHua}` : ''}`;
}

function palaceAt(chart: ZiweiChart, branch: number): Palace | undefined {
  return chart.palaces.find(p => p.branch === ((branch % 12) + 12) % 12);
}

/** 三方四正：本宫、对宫、两个三合宫（地支 ±4）。 */
function sanFangSiZheng(chart: ZiweiChart, p: Palace): string {
  return [p.branch + 6, p.branch + 4, p.branch + 8]
    .map(b => palaceAt(chart, b)?.name)
    .filter(Boolean)
    .join('、');
}

function palaceBlock(chart: ZiweiChart, p: Palace): string {
  const tags = [
    p.isShenGong ? '身宫' : '',
    p.isCurrentDaXian ? '当前大限' : '',
  ].filter(Boolean);
  const head = `【${p.name}】${gz(p.stem, p.branch)}宫${tags.length ? `（${tags.join('、')}）` : ''}`
    + (p.daXianAge ? ` 大限${p.daXianAge[0]}–${p.daXianAge[1]}岁` : '');

  const lines = [head];
  for (const type of ['major', 'lucky', 'sha', 'minor'] as const) {
    const stars = p.stars.filter(s => s.type === type);
    if (stars.length) lines.push(`  ${TYPE_LABEL[type]}：${stars.map(starText).join('、')}`);
  }
  if (p.isEmpty) {
    lines.push(`  空宫，借对宫${p.borrowedFromName ?? ''}主星：${p.borrowedStars?.length ? p.borrowedStars.join('、') : '无'}`);
  }
  lines.push(`  三方四正：${sanFangSiZheng(chart, p)}`);
  return lines.join('\n');
}

export function buildChartContext(chart: ZiweiChart, opts: { label?: string; now?: Date } = {}): string {
  const { birthInfo: b, lunarInfo: l } = chart;
  const now = opts.now ?? new Date();
  const ming = palaceAt(chart, chart.mingGongBranch);
  const shen = palaceAt(chart, chart.shenGongBranch);
  const siHuaStars = chart.palaces.flatMap(p =>
    p.stars.filter(s => s.siHua).map(s => `${s.name}化${s.siHua}（入${p.name}）`));

  const out: string[] = [];
  out.push(`# ${opts.label ?? '命盘'}`);
  out.push([
    `性别：${b.gender === 'male' ? '男' : '女'}（${chart.yinYangGender ?? ''}）`,
    `出生：公历 ${b.year}年${b.month}月${b.day}日 ${BRANCHES[b.hour]}时；农历 ${l.lunarYear}年${l.isLeapMonth ? '闰' : ''}${Math.abs(l.lunarMonth)}月${l.lunarDay}日`,
    l.fourPillars ? `四柱（节气）：${l.fourPillars.join(' ')}` : '',
    `五行局：${chart.wuxingJuName}；命主：${chart.mingZhu ?? ''}；身主：${chart.shenZhu ?? ''}`,
    `命宫在${BRANCHES[chart.mingGongBranch]}宫；身宫在${BRANCHES[chart.shenGongBranch]}宫${shen ? `（与${shen.name}${shen === ming ? '' : '宫'}同宫）` : ''}`,
    `生年四化：${siHuaStars.join('；') || '无'}`,
  ].filter(Boolean).join('\n'));

  out.push('## 十二宫');
  const sorted = [...chart.palaces].sort(
    (x, y) => PALACE_ORDER.indexOf(x.name) - PALACE_ORDER.indexOf(y.name));
  out.push(sorted.map(p => palaceBlock(chart, p)).join('\n'));

  out.push('## 大限');
  out.push(chart.daXians.map((dx, i) =>
    `${dx.startAge}–${dx.endAge}岁 ${dx.palaceName}（${BRANCHES[dx.palaceBranch]}）${i === chart.currentDaXianIndex ? ' ← 当前' : ''}`,
  ).join('\n'));
  out.push(`当前虚岁：${chart.currentAge}`);

  const year = now.getFullYear();
  const ln = getLiuNianSiHua(year);
  const lnBranch = getYearBranchIndex(year);
  const lnPalace = palaceAt(chart, lnBranch);
  out.push('## 流年');
  out.push(
    `今年 ${year}（${ln.stemName}${BRANCHES[lnBranch]}年）：流年命宫在${BRANCHES[lnBranch]}，即本命${lnPalace?.name ?? ''}；`
    + `流年四化：${(['禄', '权', '科', '忌'] as const).map(h => `${ln.transforms[h]}化${h}`).join('、')}`,
  );

  const patterns = detectPatterns(chart);
  if (patterns.length) {
    out.push('## 引擎识别的格局');
    out.push(patterns.map(p => {
      const extra = [
        p.conditions?.breaking?.length ? `破格因素：${p.conditions.breaking.join('；')}` : '',
        p.source ? `出处：${p.source}` : '',
      ].filter(Boolean).join('；');
      return `- ${p.name}（${LEVEL_LABEL[p.level]}，涉及${p.palaces.join('、')}）：${p.description}${extra ? `｜${extra}` : ''}`;
    }).join('\n'));
  }

  return out.join('\n\n');
}
