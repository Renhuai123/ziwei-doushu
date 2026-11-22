'use client';
import { createContext, useContext, useLayoutEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: 'dark', toggle: () => {} });

function ThemeToggleButton({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9000,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1px solid var(--t-border)',
        background: 'var(--t-bg)',
        color: 'var(--t-gold)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        transition: 'opacity 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useLayoutEffect(() => {
    const saved = localStorage.getItem('ziwei-theme') as Theme | null;
    const initial = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('ziwei-theme', next);
      return next;
    });
    setTimeout(() => root.classList.remove('theme-transitioning'), 420);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <ThemeToggleButton theme={theme} onToggle={toggle} />
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
