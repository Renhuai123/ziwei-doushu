import 'server-only';
import type { Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES, SHICHEN, STEMS } from '@/lib/ziwei/constants';
import { detectPatterns, type Pattern } from '@/lib/ziwei/patterns';

/**
 * /api/interpret 的系统提示词与命盘摘要。
 *
 * 原则：模型只做「解读」，不重新排盘。所有星曜、宫位、四化、格局
 * 都由本仓库的排盘引擎给出，摘要里没有的数据不允许模型编造。
 */

const SYSTEM_PROMPT = `你是精通倪海厦《天纪》紫微斗数体系的命理分析师。你的任务是基于下方给出的命盘数据做解读，不要重新排盘，也不要怀疑或改写数据。

【解读原则】
1. 以命宫为本、三方四正为用；重点看生年四化、宫干四化、大限与流年四化、空宫借对宫、星曜庙旺利陷、以及已识别出的格局。
2. 每个判断都要落到具体的星曜、宫位、四化或格局上。数据里没有的信息不要编造；不确定时用「倪师体系认为」「一般而言」等措辞，不要伪造倪师原话。
3. 区分先天格局与后天努力，给出具体、可执行的建议；可以指出风险，但不要宿命化、恐吓或做绝对断言。
4. 健康只作传统命理参考，不能替代医疗诊断；财务、法律、婚姻等重大决定同理。
5. 使用简体中文，语气沉稳、具体、克制，避免空泛套话和过度堆砌吉凶形容词。

【输出格式】
1. 严格按用户给出的段落结构输出。每个段落标题必须单独占一行，格式为 **【标题】**，不要加序号、emoji 或其他符号。
2. 正文用短段落或短句；需要强调时用 **文字**；不要使用 Markdown 表格、代码块、HTML、分隔线。
3. 每个段落 2–5 句，全文控制在 700–1000 字；用户明确要求更长时再展开。
4. 只输出解读正文，不要复述命盘数据，不要写「根据您提供的命盘」之类的开场白。`;

const LEVEL_LABEL: Record<Pattern['level'], string> = {
  excellent: '上格',
  good: '吉格',
  neutral: '中性',
  caution: '警示',
};

const LEVEL_ORDER: Record<Pattern['level'], number> = {
  excellent: 0,
  good: 1,
  caution: 2,
  neutral: 3,
};

function formatStar(star: Star): string {
  const suffix: string[] = [];
  if (star.brightnessRaw) suffix.push(`（${star.brightnessRaw}）`);
  if (star.siHua) suffix.push(`化${star.siHua}`);
  return `${star.name}${suffix.join('')}`;
}

function formatPalace(palace: Palace): string {
  const title = `${palace.name}（${STEMS[palace.stem] ?? '?'}${BRANCHES[palace.branch] ?? '?'}）`;
  const stars = Array.isArray(palace.stars) ? palace.stars : [];
  const majors = stars.filter(s => s.type === 'major').map(formatStar);
  const others = stars.filter(s => s.type !== 'major').map(formatStar);
  const parts: string[] = [];

  if (palace.isEmpty || majors.length === 0) {
    const borrowed = palace.borrowedStars?.length
      ? palace.borrowedStars.join('、')
      : '无主星';
    parts.push(`空宫，借对宫${palace.borrowedFromName ?? '（未知）'}（${borrowed}）`);
  } else {
    parts.push(`主星：${majors.join('、')}`);
  }
  if (others.length > 0) parts.push(`辅煞：${others.join('、')}`);
  if (palace.selfSihua?.length) {
    parts.push(`自化：${palace.selfSihua.map(s => `${s.starName}化${s.siHua}`).join('、')}`);
  }

  const tags: string[] = [];
  if (palace.isShenGong && palace.name !== '命宫') tags.push('身宫');
  return `- ${title}${tags.length ? `【${tags.join('、')}】` : ''}：${parts.join('；')}`;
}

function formatLunarMonth(month: number): string {
  if (!Number.isFinite(month) || month === 0) return '未知';
  return month < 0 ? `闰${Math.abs(month)}月` : `${month}月`;
}

function formatBirth(chart: ZiweiChart): string[] {
  const { birthInfo, lunarInfo } = chart;
  const gender = birthInfo.gender === 'female' ? '女' : '男';
  const shichen = SHICHEN[birthInfo.hour]?.name ?? `第${birthInfo.hour}个时辰`;
  const lines = [
    `- 公历：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${shichen}（${gender}）`,
    `- 农历：${STEMS[lunarInfo.yearStem] ?? '?'}${BRANCHES[lunarInfo.yearBranch] ?? '?'}年 ${formatLunarMonth(lunarInfo.lunarMonth)}${lunarInfo.lunarDay}日`,
  ];

  if (birthInfo.origInput) {
    const o = birthInfo.origInput;
    const clock = `${String(o.clockHour).padStart(2, '0')}:${String(o.clockMinute).padStart(2, '0')}`;
    const changed = o.year !== birthInfo.year || o.month !== birthInfo.month || o.day !== birthInfo.day;
    lines.push(
      changed
        ? `- 原始输入：${o.year}-${o.month}-${o.day} ${clock}，已按子时换日规则归到 ${birthInfo.year}-${birthInfo.month}-${birthInfo.day}`
        : `- 原始输入：${o.year}-${o.month}-${o.day} ${clock}`,
    );
  }
  if (lunarInfo.fourPillars?.length === 4) {
    lines.push(`- 四柱（节气）：${lunarInfo.fourPillars.join(' ')}`);
  }
  if (lunarInfo.fourPillarsLunar?.length === 4) {
    lines.push(`- 四柱（农历口径）：${lunarInfo.fourPillarsLunar.join(' ')}`);
  }
  if (birthInfo.province || birthInfo.city) {
    lines.push(`- 出生地：${[birthInfo.province, birthInfo.city].filter(Boolean).join(' ')}`);
  }
  return lines;
}

function formatDaXian(chart: ZiweiChart): string[] {
  const current = chart.daXians[chart.currentDaXianIndex];
  const lines = [
    `- 虚岁：${chart.currentAge}；当前公历年：${new Date().getFullYear()}（以立春后为新年）`,
    `- 五行局：${chart.wuxingJuName}`,
    `- 命宫地支：${BRANCHES[chart.mingGongBranch] ?? '?'}；身宫地支：${BRANCHES[chart.shenGongBranch] ?? '?'}；紫微星在${BRANCHES[chart.ziweiPos] ?? '?'}`,
  ];
  if (chart.mingZhu || chart.shenZhu) {
    lines.push(`- 命主：${chart.mingZhu ?? '未知'}；身主：${chart.shenZhu ?? '未知'}${chart.yinYangGender ? `；${chart.yinYangGender}` : ''}`);
  }
  if (current) {
    lines.push(`- 当前大限：${current.startAge}–${current.endAge}岁，走${current.palaceName}`);
  }
  return lines;
}

function formatPatterns(chart: ZiweiChart): string[] {
  let patterns: Pattern[];
  try {
    patterns = detectPatterns(chart);
  } catch {
    return ['- （格局识别未完成，请只依据星曜与四化解读）'];
  }
  if (patterns.length === 0) return ['- 未识别出明确格局'];

  return patterns
    .slice()
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
    .slice(0, 8)
    .map(p => {
      const desc = p.description.length > 160 ? `${p.description.slice(0, 160)}…` : p.description;
      const palaces = p.palaces.length ? `｜宫位：${p.palaces.join('、')}` : '';
      const source = p.source ? `｜出处：${p.source}` : '';
      return `- ${p.name}（${LEVEL_LABEL[p.level]}）：${desc}${palaces}${source}`;
    });
}

/** 把结构化命盘压成模型可读的紧凑摘要（不使用 JSON，避免 token 膨胀）。 */
export function describeChart(chart: ZiweiChart): string {
  const palaces = Array.isArray(chart.palaces) ? chart.palaces : [];
  const daXians = Array.isArray(chart.daXians) ? chart.daXians : [];

  const sections: string[] = [
    '【出生信息】',
    ...formatBirth(chart),
    '',
    '【命盘概要】',
    ...formatDaXian(chart),
    '',
    '【十二宫】',
    ...palaces
      .slice()
      .sort((a, b) => a.branch - b.branch)
      .map(formatPalace),
    '',
    '【大限】',
    ...daXians.map((dx, i) => {
      const stem = dx.stemName ? `${dx.stemName}干` : '';
      const siHua = dx.siHua
        ? `｜四化：禄→${dx.siHua.lu}、权→${dx.siHua.quan}、科→${dx.siHua.ke}、忌→${dx.siHua.ji}`
        : '';
      const mark = i === chart.currentDaXianIndex ? '【当前】' : '';
      return `- ${mark}${dx.startAge}–${dx.endAge}岁：${dx.palaceName}${stem ? `（${stem}）` : ''}${siHua}`;
    }),
    '',
    '【已识别格局】',
    ...formatPatterns(chart),
  ];

  return sections.join('\n');
}

export function buildSystemPrompt(chart: ZiweiChart): string {
  return `${SYSTEM_PROMPT}\n\n===== 命盘数据（以此为准）=====\n${describeChart(chart)}`;
}
