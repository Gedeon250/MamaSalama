import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppTheme = 'coral' | 'ocean' | 'forest' | 'lavender' | 'sunset' | 'midnight';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const themeConfig: Record<AppTheme, { name: string; description: string; preview: string[] }> = {
  coral: {
    name: 'Warm Coral',
    description: 'Nurturing & warm — the default theme',
    preview: ['#d4654a', '#6db89e', '#f5ebe4'],
  },
  ocean: {
    name: 'Ocean Blue',
    description: 'Calm & trustworthy — cool tones',
    preview: ['#3b82f6', '#06b6d4', '#eff6ff'],
  },
  forest: {
    name: 'Forest Green',
    description: 'Natural & refreshing — earthy greens',
    preview: ['#16a34a', '#84cc16', '#f0fdf4'],
  },
  lavender: {
    name: 'Soft Lavender',
    description: 'Gentle & calming — purple tones',
    preview: ['#8b5cf6', '#c084fc', '#faf5ff'],
  },
  sunset: {
    name: 'Golden Sunset',
    description: 'Energetic & bright — warm golds',
    preview: ['#f59e0b', '#ef4444', '#fffbeb'],
  },
  midnight: {
    name: 'Midnight',
    description: 'Sleek dark mode — easy on the eyes',
    preview: ['#6366f1', '#818cf8', '#1e1b4b'],
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as AppTheme) || 'coral';
  });
  const [isDark, setIsDarkState] = useState(() => {
    const saved = localStorage.getItem('app-dark');
    return saved === 'true';
  });

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    localStorage.setItem('app-theme', t);
  };

  const setIsDark = (d: boolean) => {
    setIsDarkState(d);
    localStorage.setItem('app-dark', String(d));
  };

  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('theme-coral', 'theme-ocean', 'theme-forest', 'theme-lavender', 'theme-sunset', 'theme-midnight');
    root.classList.add(`theme-${theme}`);

    // Handle dark mode
    if (isDark || theme === 'midnight') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
