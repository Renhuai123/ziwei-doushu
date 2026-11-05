/**
 * SEO 知识页 — 数据 helper
 *
 * 14 主星 × 13 topic = 182 个独立 SEO URL
 * 每页都是 STAR_DB 中对应字段的 4 段 markers（一句话定调/核心论断/命盘依据/经典出处）
 */

import { STAR_DB } from '@/lib/ziwei/db-analysis';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
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

interface StarContent {
  mingGong: string;
  personality: string;
  xiongDi?: string;
  fuQi: string;
  ziNv?: string;
  caiBo: string;
  jiE: string;
  qianYi?: string;
  jiaoYou?: string;
  guanLu: string;
  tianZhai?: string;
  fuDe?: string;
  fuMu?: string;
}

const TOPIC_TO_FIELD: Record<TopicKey, keyof StarContent> = {
  overview:    'mingGong',
  personality: 'personality',
  love:        'fuQi',
  career:      'guanLu',
  wealth:      'caiBo',
  health:      'jiE',
  family:      'xiongDi' as keyof StarContent,
  children:    'ziNv' as keyof StarContent,
  move:        'qianYi' as keyof StarContent,
  friends:     'jiaoYou' as keyof StarContent,
  home:        'tianZhai' as keyof StarContent,
  spirit:      'fuDe' as keyof StarContent,
  parents:     'fuMu' as keyof StarContent,
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
  parsed: ParsedContent;
  exists: boolean;
}

export function getKnowledge(star: string, topic: TopicKey): KnowledgeData {
  const profile = STAR_DB[star] as StarContent | undefined;
  const field = TOPIC_TO_FIELD[topic];
  const content = profile && field ? (profile[field] as string | undefined) ?? '' : '';
  return {
    star,
    topic,
    topicLabel: TOPIC_LABEL[topic],
    palaceName: TOPIC_PALACE_NAME[topic],
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
  '紫微': 'Tử Vi là Đế tinh, chủ về tôn quý, hóa khí là Tôn. Tọa Mệnh chủ có khí chất lãnh đạo, hợp với nền tảng lớn và vị trí cao.',
  '天机': 'Thiên Cơ là sao Trí Tuệ, chủ về thiện biến cơ linh, hóa khí là Thiện. Tọa Mệnh chủ thông minh cơ biến, hợp với phụ tá và mưu lược hoạch định.',
  '太阳': 'Thái Dương là Nam Quý tinh, chủ về danh dự và công vụ, hóa khí là Quý. Tọa Mệnh chủ quang minh lỗi lạc, hợp với công chức và gây dựng danh tiếng.',
  '武曲': 'Vũ Khúc là Tài tinh, chủ về cương nghị quả quyết, hóa khí là Tài. Tọa Mệnh chủ năng lực quản lý tài chính mạnh mẽ, hợp với thực nghiệp và tài chính.',
  '天同': 'Thiên Đồng là Phúc tinh, chủ về ôn hòa hưởng lạc, hóa khí là Phúc. Tọa Mệnh chủ tính tình ôn hòa, có phúc khí.',
  '廉贞': 'Liêm Trinh là Thứ Đào Hoa tinh, văn võ kiêm toàn, hóa khí là Tù. Tọa Mệnh chủ đa tài đa nghệ, tình cảm phong phú.',
  '天府': 'Thiên Phủ là sao Nam Đế thủ tài, chủ về điềm đạm bảo thủ, hóa khí là Lệnh. Tọa Mệnh chủ phẩm hạnh đoan chính, khéo giữ tài khố.',
  '太阴': 'Thái Âm là sao Mặt Trăng phú quý, chủ về điền trạch phú quý, hóa khí là Phú. Tọa Mệnh chủ tình cảm tinh tế, nữ mệnh cát lợi nhất.',
  '贪狼': 'Tham Lang là sao Đào Hoa dục vọng, đa tài giỏi giao thiệp, hóa khí là Đào Hoa. Tọa Mệnh chủ nhiều tài nghệ, giao tế rộng rãi.',
  '巨门': 'Cự Môn là sao Thị Phi khẩu tài, chủ về biện luận và truyền thông, hóa khí là Ám. Tọa Mệnh chủ có tài ăn nói, hợp với nghề luật sư, giáo viên.',
  '天相': 'Thiên Tướng là Ấn tinh phụ tá, chủ về trung hậu thật thà, hóa khí là Ấn. Tọa Mệnh chủ phẩm hạnh đoan chính, hợp với hành chính và pháp vụ.',
  '天梁': 'Thiên Lương là Lão Nhân tinh và Ấm tinh, khéo phùng hung hóa cát, hóa khí là Ấm. Tọa Mệnh chủ từ bi thiện lương, hợp với pháp luật và y học.',
  '七杀': 'Thất Sát là Tướng tinh, chủ về cô độc, quả quyết và mạo hiểm, hóa khí là Túc Sát. Tọa Mệnh chủ cương nghị quả quyết, hợp với quân đội, cảnh sát hoặc khởi nghiệp.',
  '破军': 'Phá Quân là sao phá hoại và đổi mới, chủ về lục thân duyên bạc, hóa khí là Hao. Tọa Mệnh chủ khai sáng biến động, hợp với chuyên môn kỹ thuật.',
};
