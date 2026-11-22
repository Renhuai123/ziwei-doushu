import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Lá số Tử Vi · Tử Vi Đẩu Số',
  description: 'Lập lá số Tử Vi Đẩu Số: cách cục, đại hạn, lưu niên, tình cảm, sự nghiệp, tài vận và sức khỏe',
  keywords: 'Tử Vi Đẩu Số, lá số tử vi, lập lá số, 14 chính tinh, 12 cung, đại hạn, lưu niên',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lá số Tử Vi · Tử Vi Đẩu Số',
    description: 'Lập lá số Tử Vi Đẩu Số: cách cục, đại hạn, lưu niên, tình cảm, sự nghiệp, tài vận và sức khỏe',
    url: SITE_URL,
    siteName: 'Tử Vi Đẩu Số',
    locale: 'vi_VN',
    type: 'website',
  },
  // 站长平台验证（拿到 verification code 后填入对应字段，重新部署即可）
  verification: {
    // Google Search Console: 在 https://search.google.com/search-console 添加站点后获取
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    // Bing Webmaster Tools: 在 https://www.bing.com/webmasters 添加站点后获取
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '808FFC6023A2C359B375DD860FEDA856',
      // 百度站长（等执照下来后）
      'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
      // 360 站长（等执照下来后）
      '360-site-verification': process.env.NEXT_PUBLIC_360_VERIFICATION || '',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="dark" suppressHydrationWarning>
      {/* suppressHydrationWarning: extension trình duyệt (dịch, Grammarly…) hay chèn thuộc tính vào <body> trước khi React hydrate */}
      <body className="min-h-screen" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
