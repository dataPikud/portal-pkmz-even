import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
      title={theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}
    >
      <div className={styles.iconWrap}>
        {theme === 'light' ? (
          <Moon size={18} className={styles.icon} />
        ) : (
          <Sun size={18} className={styles.icon} />
        )}
      </div>
    </button>
  );
}
