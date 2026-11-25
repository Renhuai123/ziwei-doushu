import { ImageResponse } from 'next/og';
import { ogFonts, renderIcon } from '@/lib/og/render';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  // iOS 自己会裁圆角，这里给直角
  return new ImageResponse(renderIcon(size.width, 0), { ...size, fonts: await ogFonts() });
}
