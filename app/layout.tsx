import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Lá Số Tử Vi · Tử Vi Đẩu Số chính truyền Nghê Hải Hạ',
  description: 'Dựa trên hệ thống Tử Vi Đẩu Số chính truyền của Nghê Hải Hạ, AI luận giải chuyên sâu Cách Cục lá số, Đại Hạn Lưu Niên, phân tích toàn diện tình cảm, sự nghiệp, tài vận và sức khỏe',
  keywords: 'Tử Vi Đẩu Số, Nghê Hải Hạ, Tử Vi Đẩu Số Toàn Tập, Tử Vi Đẩu Số Toàn Thư, Cốt Tủy Phú, lá số, luận mệnh, 14 chính tinh, 12 cung',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lá Số Tử Vi · Tử Vi Đẩu Số chính truyền Nghê Hải Hạ',
    description: 'Dựa trên hệ thống Tử Vi Đẩu Số chính truyền của Nghê Hải Hạ, AI luận giải chuyên sâu Cách Cục lá số, Đại Hạn Lưu Niên, phân tích toàn diện tình cảm, sự nghiệp, tài vận và sức khỏe',
    url: SITE_URL,
    siteName: 'Nghiên cứu Tử Vi',
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
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
