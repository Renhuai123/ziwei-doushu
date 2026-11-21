'use client';
import { useEffect } from 'react';

/** 排盘引擎（iztro + lunar-javascript，约 250KB gzip）按需加载，不压在表单首屏上。 */
export const loadEngine = () => import('./algorithm');

/** 页面渲染后趁空闲预取引擎：用户填完表时通常已经下载好，点提交不用再等。 */
export function usePrefetchEngine() {
  useEffect(() => {
    const prefetch = () => { void loadEngine(); };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(prefetch, 1000);
    return () => clearTimeout(t);
  }, []);
}
