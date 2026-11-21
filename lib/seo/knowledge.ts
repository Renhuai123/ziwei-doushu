/**
 * SEO 知识页 — 数据 helper
 *
 * 14 主星 × 13 topic = 182 个独立 SEO URL
 * 每页都是 STAR_DB 中对应字段的 4 段 markers（一句话定调/核心论断/命盘依据/经典出处）
 */

import { STAR_DB } from '@/lib/ziwei/db-analysis';
import type { StarContent, TopicKey } from '@/lib/ziwei/db-analysis';
import { TOPIC_PALACE_NAME, TOPIC_LABEL } from '@/lib/ziwei/db-analysis';

export const ALL_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
];

// 主星名 ↔ 拼音 slug 映射（URL 用 slug，避免中文 URL 在 Vercel/CDN 上的边界问题）
export const STAR_TO_SLUG: Record<string, string> = {
  '紫微': 'ziwei',
  '天机': 'tianji',
  '太阳': 'taiyang',
  '武曲': 'wuqu',
  '天同': 'tiantong',
  '廉贞': 'lianzhen',
  '天府': 'tianfu',
  '太阴': 'taiyin',
  '贪狼': 'tanlang',
  '巨门': 'jumen',
  '天相': 'tianxiang',
  '天梁': 'tianliang',
  '七杀': 'qisha',
  '破军': 'pojun',
};

export const SLUG_TO_STAR: Record<string, string> = Object.fromEntries(
  Object.entries(STAR_TO_SLUG).map(([k, v]) => [v, k])
);

export const ALL_TOPICS: TopicKey[] = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
];

const TOPIC_TO_FIELD: Record<TopicKey, keyof StarContent> = {
  overview:    'mingGong',
  personality: 'personality',
  love:        'fuQi',
  career:      'guanLu',
  wealth:      'caiBo',
  health:      'jiE',
  family:      'xiongDi',
  children:    'ziNv',
  move:        'qianYi',
  friends:     'jiaoYou',
  home:        'tianZhai',
  spirit:      'fuDe',
  parents:     'fuMu',
};

interface ParsedContent {
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
  raw: string;
  hasMarkers: boolean;
}

function parseStarContent(content: string): ParsedContent {
  const out: ParsedContent = { dingdiao: '', lundian: '', yiju: '', chuchu: '', raw: content, hasMarkers: false };
  if (!content) return out;
  if (!content.includes('**【一句话定调】**') && !content.includes('**【核心论断】**')) {
    out.lundian = content;
    return out;
  }
  out.hasMarkers = true;
  const re = /\*\*【([^】]+)】\*\*/g;
  const parts: { name: string; markerEnd: number; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    parts.push({ name: m[1], start: m.index, markerEnd: m.index + m[0].length });
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const end = i + 1 < parts.length ? parts[i + 1].start : content.length;
    const text = content.slice(p.markerEnd, end).trim();
    if (p.name === '一句话定调') out.dingdiao = text;
    else if (p.name === '核心论断') out.lundian = text;
    else if (p.name === '命盘依据') out.yiju = text;
    else if (p.name === '经典出处') out.chuchu = text;
  }
  return out;
}

export interface KnowledgeData {
  star: string;
  topic: TopicKey;
  topicLabel: string;
  palaceName: string;
  /** Palace name with exactly one 宫 suffix (iztro names 命宫 with it, the others without). */
  palaceTitle: string;
  parsed: ParsedContent;
  exists: boolean;
}

export function getKnowledge(star: string, topic: TopicKey): KnowledgeData {
  const profile: StarContent | undefined = STAR_DB[star];
  const content = profile?.[TOPIC_TO_FIELD[topic]] ?? '';
  return {
    star,
    topic,
    topicLabel: TOPIC_LABEL[topic],
    palaceName: TOPIC_PALACE_NAME[topic],
    palaceTitle: TOPIC_PALACE_NAME[topic].endsWith('宫') ? TOPIC_PALACE_NAME[topic] : `${TOPIC_PALACE_NAME[topic]}宫`,
    parsed: parseStarContent(content),
    exists: Boolean(content),
  };
}

/** 生成所有 14×13 组合（用于 generateStaticParams） */
export function getAllKnowledgeRoutes() {
  const routes: { star: string; slug: string; topic: TopicKey }[] = [];
  for (const star of ALL_STARS) {
    for (const topic of ALL_TOPICS) {
      const data = getKnowledge(star, topic);
      if (data.exists) routes.push({ star, slug: STAR_TO_SLUG[star], topic });
    }
  }
  return routes;
}

/** 主星属性简介（用于 SEO 页"了解 XX 星"section） */
export const STAR_BRIEF_SEO: Record<string, string> = {
  '紫微': '紫微为帝星，主尊贵，化气为尊。落命主有领导气场、宜大平台高位。',
  '天机': '天机为智慧星，主善变机灵，化气为善。落命主聪明机变、宜辅佐策划。',
  '太阳': '太阳为男贵星，主名誉公务，化气为贵。落命主光明磊落、宜公职名声。',
  '武曲': '武曲为财星，主刚毅果决，化气为财。落命主理财能力强、宜实业金融。',
  '天同': '天同为福星，主温和享乐，化气为福。落命主性情温和、有福气。',
  '廉贞': '廉贞为次桃花星，文武兼备，化气为囚。落命主多才多艺、感情丰富。',
  '天府': '天府为南帝守财星，主稳重保守，化气为令。落命主品行端正、善守财库。',
  '太阴': '太阴为月亮富贵星，主田宅富贵，化气为富。落命主感情细腻、女命最吉。',
  '贪狼': '贪狼为桃花欲望星，多才多社交，化气为桃花。落命主多才艺、社交广。',
  '巨门': '巨门为是非口才星，主辩论传媒，化气为暗。落命主口才好、宜律师教师。',
  '天相': '天相为印星辅佐，主忠厚老实，化气为印。落命主品行端正、宜行政法务。',
  '天梁': '天梁为老人星荫星，善逢凶化吉，化气为荫。落命主慈悲善良、宜法律医学。',
  '七杀': '七杀为将星，主孤独果决冒险，化气为肃杀。落命主刚毅果决、宜军警创业。',
  '破军': '破军为破坏创新星，主六亲缘薄，化气为耗。落命主开创变动、宜技术专长。',
};
