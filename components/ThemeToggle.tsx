'use client';

import { memo, useCallback, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export default memo(function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('speed-arena-theme') as Theme | null;
    if (saved === 'light') {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('speed-arena-theme', next);
  }, [theme]);

  return (
    <button
      onClick={toggle}
      className="font-mono text-xs text-dim hover:text-arena-white transition-colors px-2 py-1 border border-surface-light rounded"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? 'DAY' : 'NIGHT'}
    </button>
  );
});
