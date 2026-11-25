import { ImageResponse } from 'next/og';
import { ogFonts, renderIcon } from '@/lib/og/render';

/**
 * Web 应用清单（app/manifest.ts）用的方形图标：「添加到主屏幕」和安装时用 192 / 512 两种尺寸。
 * 直角满底，系统按自己的形状裁切；「紫」字占 62%，落在可裁切图标的安全区内。
 */
const SIZES = [192, 512] as const;
export const dynamicParams = false;

export function generateStaticParams() {
  return SIZES.map(size => ({ size: String(size) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const px = Number((await params).size);
  return new ImageResponse(renderIcon(px, 0), { width: px, height: px, fonts: await ogFonts() });
}
