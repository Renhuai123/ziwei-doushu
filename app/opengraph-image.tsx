import { ImageResponse } from 'next/og';
import { OG_SIZE, SITE_OG } from '@/lib/og/text';
import { C, ChartGrid, Eyebrow, OgFrame, ogFonts } from '@/lib/og/render';

export const alt = SITE_OG.alt;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame grid={<ChartGrid size={420} center={<div style={{ display: 'flex', color: C.ac, fontSize: 120, fontWeight: 700 }}>紫</div>} />}>
        <Eyebrow>{SITE_OG.eyebrow}</Eyebrow>
        <div style={{ display: 'flex', fontSize: 112, fontWeight: 700, letterSpacing: 8, lineHeight: 1.1, marginBottom: 36 }}>
          {SITE_OG.title}
        </div>
        {SITE_OG.lines.map(line => (
          <div key={line} style={{ display: 'flex', fontSize: 32, color: C.tx2, lineHeight: 1.6 }}>{line}</div>
        ))}
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
