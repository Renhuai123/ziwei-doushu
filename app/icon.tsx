import { ImageResponse } from 'next/og';
import { ogFonts, renderIcon } from '@/lib/og/render';

/** 站点图标：与页头的「紫」字徽记一致。 */
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default async function Icon() {
  return new ImageResponse(renderIcon(size.width, 14), { ...size, fonts: await ogFonts() });
}
