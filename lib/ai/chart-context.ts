import { BRANCHES, SHICHEN, STEMS } from '../ziwei/constants';
import { detectPatterns, type Pattern } from '../ziwei/patterns';
import type { Palace, Star, ZiweiChart } from '../ziwei/types';

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const LUNAR_TENS = ['初', '十', '廿', '三'];
const DIGITS = ['十', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

const STAR_GROUPS: { type: Star['type']; label: string }[] = [
  { type: 'major', label: '主星' },
  { type: 'lucky', label: '吉星' },
  { type: 'sha', label: '煞星' },
  { type: 'minor', label: '杂曜' },
];

const PATTERN_LEVEL_LABEL: Record<Pattern['level'], string> = {
  excellent: '上格',
  good: '吉格',
  neutral: '平',
  caution: '凶警',
};
const PATTERN_LEVEL_ORDER: Pattern['level'][] = ['excellent', 'good', 'neutral', 'caution'];

function lunarDayName(day: number): string {
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  return `${LUNAR_TENS[Math.floor(day / 10)]}${DIGITS[day % 10]}`;
}

function ganzhi(stem: number, branch: number): string {
  return `${STEMS[stem]}${BRANCHES[branch]}`;
}

function formatStar(star: Star): string {
  return `${star.name}${star.brightnessRaw ? `[${star.brightnessRaw}]` : ''}${star.siHua ? `化${star.siHua}` : ''}`;
}

function formatBirth(chart: ZiweiChart): string[] {
  const { birthInfo: b, lunarInfo: l } = chart;
  const shichen = SHICHEN[b.hour];
  const lines = [
    `性别：${b.gender === 'male' ? '男' : '女'}${chart.yinYangGender ? `（${chart.yinYangGender}）` : ''}`,
    `公历：${b.year}年${b.month}月${b.day}日 ${shichen.name}（${shichen.range}）`,
    `农历：${l.lunarYear}年${l.isLeapMonth ? '闰' : ''}${LUNAR_MONTHS[Math.abs(l.lunarMonth) - 1]}月${lunarDayName(l.lunarDay)}，` +
      `生年干支${ganzhi(l.yearStem, l.yearBranch)}`,
  ];
  if (b.origInput) {
    const o = b.origInput;
    const hh = String(o.clockHour).padStart(2, '0');
    const mm = String(o.clockMinute).padStart(2, '0');
    lines.push(`原始输入：${o.year}-${o.month}-${o.day} ${hh}:${mm}（排盘日与时辰已按规则换算为上面的公历与时辰）`);
  }
  if (l.fourPillars) lines.push(`四柱（节气）：${l.fourPillars.join(' ')}`);
  if (l.fourPillarsLunar && l.fourPillarsLunar.join() !== l.fourPillars?.join()) {
    lines.push(`四柱（农历口径）：${l.fourPillarsLunar.join(' ')}`);
  }
  return lines;
}

function formatKeyPalaces(chart: ZiweiChart, byBranch: Map<number, Palace>): string[] {
  const ming = byBranch.get(chart.mingGongBranch);
  const shen = byBranch.get(chart.shenGongBranch);
  const lines = [
    `五行局：${chart.wuxingJuName}`,
    `命主：${chart.mingZhu ?? '未知'}　身主：${chart.shenZhu ?? '未知'}`,
    `命宫：${ming ? ganzhi(ming.stem, ming.branch) : BRANCHES[chart.mingGongBranch]}`,
    `身宫：落在${shen?.name ?? '未知'}（${BRANCHES[chart.shenGongBranch]}）`,
  ];
  const birthYear = chart.birthInfo.year;
  lines.push(`当前虚岁：${chart.currentAge}（约${birthYear + chart.currentAge - 1}年）`);
  return lines;
}

function formatPalace(palace: Palace, byBranch: Map<number, Palace>): string {
  const tags = [palace.isMingGong ? '命宫' : '', palace.isShenGong ? '身宫所在' : ''].filter(Boolean);
  const head = `${palace.name}（${ganzhi(palace.stem, palace.branch)}${tags.length ? `，${tags.join('、')}` : ''}）`;
  const parts: string[] = [];
  for (const { type, label } of STAR_GROUPS) {
    const stars = palace.stars.filter((s) => s.type === type);
    if (stars.length) parts.push(`${label}：${stars.map(formatStar).join('、')}`);
  }
  if (palace.isEmpty) {
    const borrowed = palace.borrowedStars?.length ? palace.borrowedStars.join('、') : '无';
    parts.unshift(`主星：空宫，借对宫${palace.borrowedFromName ?? ''}主星 ${borrowed}`);
  }
  if (palace.selfSihua?.length) {
    parts.push(`宫干自化：${palace.selfSihua.map((m) => `${m.starName}化${m.siHua}`).join('、')}`);
  }
  const opposite = byBranch.get((palace.branch + 6) % 12)?.name;
  const trine = [4, 8].map((d) => byBranch.get((palace.branch + d) % 12)?.name).filter(Boolean);
  parts.push(`三方四正：对宫${opposite}，三合${trine.join('、')}`);
  return `- ${head}　${parts.join('；')}`;
}

function formatBirthYearSihua(chart: ZiweiChart): string {
  const stem = STEMS[chart.lunarInfo.yearStem];
  const hits = chart.palaces.flatMap((p) =>
    p.stars.filter((s) => s.siHua).map((s) => ({ hua: s.siHua!, line: `化${s.siHua}：${s.name}在${p.name}` })),
  );
  const order = ['禄', '权', '科', '忌'];
  hits.sort((a, b) => order.indexOf(a.hua) - order.indexOf(b.hua));
  return `生年四化（${stem}年生人）：${hits.map((h) => h.line).join('；') || '无'}`;
}

function formatDaXian(chart: ZiweiChart, byBranch: Map<number, Palace>): string[] {
  const lines = chart.daXians.map((dx, i) => {
    const palace = byBranch.get(dx.palaceBranch);
    const marker = i === chart.currentDaXianIndex ? '　← 当前大限' : '';
    const hua = dx.siHua
      ? `；大限四化 禄${dx.siHua.lu} 权${dx.siHua.quan} 科${dx.siHua.ke} 忌${dx.siHua.ji}`
      : '';
    const where = palace ? `${dx.palaceName}（${ganzhi(palace.stem, palace.branch)}）` : dx.palaceName;
    return `- ${dx.startAge}-${dx.endAge}岁：${where}${hua}${marker}`;
  });
  if (chart.currentDaXianIndex < 0) lines.push('（当前虚岁尚未进入第一个大限）');
  return lines;
}

function formatPatterns(chart: ZiweiChart): string[] {
  const patterns = detectPatterns(chart);
  if (!patterns.length) return ['（程序规则未识别出明确格局）'];
  const sorted = [...patterns].sort(
    (a, b) => PATTERN_LEVEL_ORDER.indexOf(a.level) - PATTERN_LEVEL_ORDER.indexOf(b.level),
  );
  return sorted.map((p) => {
    const note = p.description.split('。')[0].trim().slice(0, 80);
    return `- ${p.name}（${PATTERN_LEVEL_LABEL[p.level]}，涉及${p.palaces.join('、') || '—'}）${note ? `：${note}` : ''}`;
  });
}

/** Compact, factual Chinese description of a chart, written for the model to read. */
export function describeChart(chart: ZiweiChart): string {
  const byBranch = new Map(chart.palaces.map((p) => [p.branch, p]));
  const palaces = [...chart.palaces].sort((a, b) => orderFromMing(chart, a) - orderFromMing(chart, b));
  return [
    '【基本信息】',
    ...formatBirth(chart),
    ...formatKeyPalaces(chart, byBranch),
    formatBirthYearSihua(chart),
    '',
    '【十二宫】（从命宫起按宫名顺序；星名后方括号为庙旺亮度，“化X”为生年四化）',
    ...palaces.map((p) => formatPalace(p, byBranch)),
    '',
    '【大限】',
    ...formatDaXian(chart, byBranch),
    '',
    '【程序识别的格局（规则判定，仅供参考）】',
    ...formatPatterns(chart),
  ].join('\n');
}

function orderFromMing(chart: ZiweiChart, p: Palace): number {
  return (chart.mingGongBranch - p.branch + 12) % 12;
}
