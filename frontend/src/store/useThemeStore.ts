import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>(() => ({
  theme: 'dark',
  
  toggleTheme: () => {
    // No-op to enforce dark theme only
  },

  setTheme: () => {
    // No-op to enforce dark theme only
  },
}));

// הגדרת תכונה בטעינה ראשונה
document.documentElement.setAttribute('data-theme', 'dark');

