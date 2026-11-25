import type { MetadataRoute } from 'next';
import { THEME_COLOR } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '紫微命盘 · 倪海厦正宗紫微斗数',
    short_name: '紫微命盘',
    description: '基于倪海厦正宗紫微斗数体系的在线排盘与命盘解读',
    lang: 'zh-CN',
    start_url: '/',
    scope: '/',
    // 保留返回按钮：站内没有为全屏应用设计的导航
    display: 'minimal-ui',
    background_color: THEME_COLOR.dark,
    theme_color: THEME_COLOR.dark,
    icons: [192, 512].map(size => ({
      src: `/pwa-icon/${size}`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
  };
}
