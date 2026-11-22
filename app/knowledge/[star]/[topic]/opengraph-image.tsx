import { ImageResponse } from 'next/og';
import { getAllKnowledgeRoutes, getKnowledge, SLUG_TO_STAR } from '@/lib/seo/knowledge';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import { OG_SIZE, TOPIC_OG, topicOg } from '@/lib/og/text';
import { C, ChartGrid, Eyebrow, OgFrame, ogFonts } from '@/lib/og/render';

export const alt = '紫微斗数知识库专题：主星入宫论断';
export const size = OG_SIZE;
export const contentType = 'image/png';

/** 与页面同一组参数，182 张图在构建时生成。 */
export function generateStaticParams() {
  return getAllKnowledgeRoutes().map(r => ({ star: r.slug, topic: r.topic }));
}

export default async function Image({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug] ?? '紫微';
  const og = topicOg(star, (getKnowledge(star, topic as TopicKey).exists ? topic : 'overview') as TopicKey);

  return new ImageResponse(
    (
      <OgFrame grid={<ChartGrid size={400} center={<div style={{ display: 'flex', color: C.ac, fontSize: 72, fontWeight: 700, letterSpacing: 6 }}>{og.star}</div>} />}>
        <Eyebrow>{TOPIC_OG.eyebrow}</Eyebrow>
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, letterSpacing: 4, lineHeight: 1.15, marginBottom: 20 }}>
          {og.title}
        </div>
        <div style={{ display: 'flex', fontSize: 36, color: C.tx2, marginBottom: 64 }}>{og.subtitle}</div>
        <div style={{ display: 'flex', fontSize: 24, color: C.tx3 }}>{TOPIC_OG.footer}</div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
