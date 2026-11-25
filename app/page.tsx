import HomeView from './HomeView';
import { homeJsonLd, JsonLd } from '@/lib/seo/json-ld';

// 首页主体是客户端组件（滚动动画、主题），metadata 与结构化数据只能放在这个服务端外壳里。
export const metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <HomeView />
    </>
  );
}
