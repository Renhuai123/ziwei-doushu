/**
 * 分享预览图 / 站点图标上出现的全部文字。
 * 预览图用的是按这些文字裁剪过的 Noto Sans SC 子集（lib/og/fonts），
 * 改了这里的文字或新增了主星、宫位，请运行 `npm run og:font` 重新生成字体，否则新字会显示成方框。
 */
import { ALL_STARS, ALL_TOPICS, getKnowledge } from '@/lib/seo/knowledge';

export const OG_SIZE = { width: 1200, height: 630 };

export const SITE_OG = {
  eyebrow: '倪海厦体系 · 免费开源',
  title: '紫微命盘',
  lines: ['紫微斗数排盘 · 两人合盘', '十四主星 × 十三宫知识库 · 古籍原典'],
  alt: '紫微命盘：紫微斗数排盘、合盘、星曜知识与古籍原典',
};

export const TOPIC_OG = {
  eyebrow: '紫微斗数知识库',
  footer: '紫微命盘 · 倪海厦《天纪》体系',
};

export const ICON_GLYPH = '紫';

/** 命盘十二宫的地支，按传统 4×4 盘面从左上顺时针外圈摆放用。 */
export const GRID_BRANCHES = {
  top: ['巳', '午', '未', '申'],
  right: ['酉', '戌'],
  bottom: ['寅', '丑', '子', '亥'],
  left: ['辰', '卯'],
};

export function topicOg(star: string, topic: (typeof ALL_TOPICS)[number]) {
  const k = getKnowledge(star, topic);
  return { title: `${star}入${k.palaceTitle}`, subtitle: k.topicLabel, star };
}

/** 预览图可能用到的所有字符（字体子集脚本读取）。 */
export function allOgText(): string {
  const parts: string[] = [
    SITE_OG.eyebrow, SITE_OG.title, ...SITE_OG.lines,
    TOPIC_OG.eyebrow, TOPIC_OG.footer, ICON_GLYPH,
    ...Object.values(GRID_BRANCHES).flat(),
  ];
  for (const star of ALL_STARS) {
    for (const topic of ALL_TOPICS) {
      const t = topicOg(star, topic);
      parts.push(t.title, t.subtitle, t.star);
    }
  }
  return parts.join('');
}
