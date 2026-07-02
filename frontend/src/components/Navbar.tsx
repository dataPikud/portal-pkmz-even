import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import type { System } from '../types';
import styles from './Navbar.module.css';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'בוקר טוב';
  if (hour >= 12 && hour < 17) return 'צהריים טובים';
  if (hour >= 17 && hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const now = useClock();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<System[]>([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // חיפוש debounced
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const data = await api.systems.search(query);
        setResults(data);
        setOpen(true);
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // סגירה בלחיצה מחוץ
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSystemClick(system: System) {
    void api.visits.record(system.id);
    window.open(system.url, '_blank', 'noopener,noreferrer');
    setQuery('');
    setOpen(false);
  }

  return (
    <nav className={styles.navbar} role="navigation" aria-label="ניווט ראשי">
      {/* ימין: לוגו + שם */}
      <div className={styles.right}>
        <a href="/" className={styles.brand} aria-label="עמוד הבית">
          <div className={styles.logoBox} aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="currentColor" />
              <path d="M10 20 L20 10 L30 20 L20 30 Z" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div className={styles.logoBox} aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="currentColor" opacity="0.75" />
              <circle cx="20" cy="20" r="8" fill="white" opacity="0.9" />
            </svg>
          </div>
        </a>
      </div>

      {/* מרכז: חיפוש */}
      <div className={styles.center} ref={searchRef}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="חיפוש מערכות..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="חיפוש מערכות"
            aria-expanded={open}
            aria-haspopup="listbox"
            autoComplete="off"
          />
          {query && (
            <button
              className={styles.clearBtn}
              onClick={() => { setQuery(''); setOpen(false); }}
              aria-label="נקה חיפוש"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {open && (
          <ul className={styles.dropdown} role="listbox" aria-label="תוצאות חיפוש">
            {results.length === 0 ? (
              <li className={styles.noResults} role="option" aria-selected="false">
                לא נמצאו תוצאות
              </li>
            ) : (
              results.map((sys) => (
                <li key={sys.id} role="option" aria-selected="false">
                  <button
                    className={styles.resultItem}
                    onClick={() => handleSystemClick(sys)}
                  >
                    <span className={styles.resultName}>{sys.name}</span>
                    {sys.subCategory?.mainCategory && (
                      <span className={styles.resultCat}>
                        {sys.subCategory.mainCategory.name}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* שמאל: ברכה + שם + תאריך/שעה */}
      <div className={styles.left}>
        <div className={styles.greetingBlock}>
          <span className={styles.greeting}>
            {getGreeting()}
            {user ? `, ${user.displayName}` : ''}
          </span>
          <span className={styles.datetime}>
            {formatDate(now)} &nbsp;|&nbsp; {formatTime(now)}
          </span>
        </div>
        {user?.isAdmin && (
          <button
            className={styles.adminBtn}
            onClick={() => navigate('/admin')}
            aria-label="פאנל ניהול"
          >
            ניהול
          </button>
        )}
      </div>
    </nav>
  );
}
