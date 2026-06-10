'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface DashboardThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const DashboardThemeContext = createContext<DashboardThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export function useDashboardTheme() {
  return useContext(DashboardThemeContext);
}

const STORAGE_KEY = 'stamply_dashboard_theme';

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <DashboardThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}
