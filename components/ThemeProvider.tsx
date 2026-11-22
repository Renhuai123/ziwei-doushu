'use client';
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { THEME_COLOR } from '@/lib/site';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'ziwei-theme';

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: 'dark', toggle: () => {} });

/**
 * 主题的唯一来源是 <html data-theme>：layout 里的内联脚本在首屏渲染前按 localStorage 设好它，
 * 这里只订阅它的变化。服务端快照固定为 dark，水合时 React 会先用服务端值再切到真实值，不会报水合不一致。
 */
function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // 其他标签页切换主题时同步过来
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      document.documentElement.setAttribute('data-theme', e.newValue);
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener('storage', onStorage);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as Theme);

  // 手机浏览器地址栏跟着主题变色（layout 里输出的默认值是深色）
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);

  const toggle = () => {
    const root = document.documentElement;
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-transitioning');
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* 隐私模式下不可写时只在本页生效 */ }
    setTimeout(() => root.classList.remove('theme-transitioning'), 420);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
