import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Film } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../lib/api';
import type { System } from '../types';
import styles from './Navbar.module.css';
import pakmazLogo from '../assets/PakmazLogo.svg.png';
import pakmazTikshuvLogo from '../assets/PakmazTikshuvLogo.svg.png';

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
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<System[]>([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.isAdmin ?? false;
  const isContentAdmin = user?.isContentAdmin ?? false;
  const canManage = isAdmin || isContentAdmin;

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
      {/* כפתורי ניווט שמאל */}
      <div className={styles.navActions}>
        {/* קישור לחומרי הטמעה – גלוי לכולם */}
        <button
          className={`${styles.contentBtn} ${location.pathname === '/content' ? styles.contentBtnActive : ''}`}
          onClick={() => navigate('/content')}
          aria-label="חומרי הטמעה"
          aria-current={location.pathname === '/content' ? 'page' : undefined}
        >
          <Film size={15} />
          חומרי הטמעה
        </button>

        {/* כפתור ניהול – גלוי ל-isAdmin ו-isContentAdmin */}
        {canManage && (
          <button
            className={`${styles.adminBtn} ${location.pathname === '/admin' ? styles.adminBtnActive : ''}`}
            onClick={() => navigate('/admin')}
            aria-label="פאנל ניהול"
            aria-current={location.pathname === '/admin' ? 'page' : undefined}
          >
            ניהול
          </button>
        )}
      </div>

      {/* ימין: ברכה + שם + תאריך/שעה */}
      <div className={styles.right}>
        <div className={styles.greetingBlock}>
          <span className={styles.greeting}>
            {getGreeting()}
            {user ? `, ${user.displayName}` : ''}
          </span>
          <span className={styles.datetime}>
            {formatDate(now)} &nbsp;|&nbsp; {formatTime(now)}
          </span>
        </div>
        <ThemeToggle />
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

      {/* שמאל: לוגו + שם */}
      <div className={styles.left}>
        <a href="/" className={styles.brand} aria-label="עמוד הבית">
          <div className={styles.logoBox} aria-hidden="true">
            <img className={styles.pakmazLogo} src={pakmazLogo} alt='pakmaz' />
          </div>
          <div className={styles.logoBox} aria-hidden="true">
            <img className={styles.pakmazTikshuvLogo} src={pakmazTikshuvLogo} alt='pakmaz tikshuv' />
          </div>
        </a>
      </div>
    </nav>
  );
}
