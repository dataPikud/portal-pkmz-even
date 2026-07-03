import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// קריאת הבחירה מ-localStorage
const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('portal-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  // default: בהתאם להעדפת המערכת
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('portal-theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return { theme: newTheme };
    }),

  setTheme: (theme) => {
    localStorage.setItem('portal-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));

// הגדרת תכונה בטעינה ראשונה
document.documentElement.setAttribute('data-theme', getInitialTheme());
