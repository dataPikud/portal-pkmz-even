import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  Star,
  Mail,
  User,
  Video,
  Share2,
  BarChart3,
  Users,
  ShieldCheck,
  Truck,
  Target,
  Dumbbell,
  Globe,
  HelpCircle,
  Server,
  DollarSign,
  BookOpen,
} from 'lucide-react';
import { api } from '../lib/api';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useThemeStore } from '../store/useThemeStore';
import type { MainCategory, System } from '../types';
import styles from './CategoryPage.module.css';

// Dynamic fallback icons & gradient backdrops for systems without an imageUrl in dark mode
function getSystemFallbackIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('דואר') || n.includes('מייל') || n.includes('mail')) {
    return { Icon: Mail, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' };
  }
  if (n.includes('שירות') || n.includes('אישי') || n.includes('עובדים') || n.includes('פרופיל')) {
    return { Icon: User, gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', color: '#fff' };
  }
  if (n.includes('ישיבות') || n.includes('וידאו') || n.includes('שיחות') || n.includes('meeting')) {
    return { Icon: Video, gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff' };
  }
  if (n.includes('sharepoint') || n.includes('שת"פ') || n.includes('מסמכים') || n.includes('שיתוף')) {
    return { Icon: Share2, gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', color: '#fff' };
  }
  if (n.includes('דוחות') || n.includes('אנליטיקה') || n.includes('bi') || n.includes('נתונים')) {
    return { Icon: BarChart3, gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: '#fff' };
  }
  if (n.includes('כוח אדם') || n.includes('משאבי אנוש') || n.includes('גיוס')) {
    return { Icon: Users, gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', color: '#fff' };
  }
  if (n.includes('תבל"ל') || n.includes('אבטחה') || n.includes('גישות') || n.includes('סייבר')) {
    return { Icon: ShieldCheck, gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', color: '#fff' };
  }
  if (n.includes('לוגיסטיקה') || n.includes('משלוחים') || n.includes('רכש')) {
    return { Icon: Truck, gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', color: '#fff' };
  }
  if (n.includes('מודיעין') || n.includes('מטרה') || n.includes('איסוף')) {
    return { Icon: Target, gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: '#fff' };
  }
  if (n.includes('אימונים') || n.includes('כושר') || n.includes('הדרכה')) {
    return { Icon: Dumbbell, gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: '#fff' };
  }
  if (n.includes('תמיכה') || n.includes('helpdesk')) {
    return { Icon: HelpCircle, gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', color: '#fff' };
  }
  if (n.includes('שרת') || n.includes('ניטור') || n.includes('תשתיות')) {
    return { Icon: Server, gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', color: '#fff' };
  }
  if (n.includes('כספים') || n.includes('תקציב')) {
    return { Icon: DollarSign, gradient: 'linear-gradient(135deg, #84cc16 0%, #4d7c0f 100%)', color: '#fff' };
  }
  if (n.includes('נהלים') || n.includes('ידע') || n.includes('ספרייה')) {
    return { Icon: BookOpen, gradient: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', color: '#fff' };
  }

  return { Icon: Globe, gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', color: '#fff' };
}

function SystemCard({ system, isDark }: { system: System; isDark: boolean }) {
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFav = favorites.includes(system.id);

  function handleClick() {
    void api.visits.record(system.id);
    window.open(system.url, '_blank', 'noopener,noreferrer');
  }

  function handleToggleStar(e: React.MouseEvent) {
    e.stopPropagation();
    toggleFavorite(system.id);
  }

  const fallback = getSystemFallbackIcon(system.name);
  const FallbackIcon = fallback.Icon;

  // Dark Mode Card: Centered layout with rounded image box top-center
  if (isDark) {
    return (
      <article
        className={`${styles.card} ${isFav ? styles.cardFav : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`פתח את ${system.name}`}
      >
        <button
          type="button"
          className={`${styles.starBtn} ${isFav ? styles.starFavActive : ''}`}
          onClick={handleToggleStar}
          aria-label={isFav ? `הסר את ${system.name} ממועדפים` : `הוסף את ${system.name} למועדפים`}
          title={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        <div className={styles.imageContainer} style={{ background: system.imageUrl ? undefined : fallback.gradient }}>
          {system.imageUrl ? (
            <img src={system.imageUrl} alt={system.name} className={styles.systemImg} />
          ) : (
            <FallbackIcon size={30} color={fallback.color} aria-hidden="true" />
          )}
        </div>

        <h3 className={styles.cardName}>{system.name}</h3>
        {system.description && (
          <p className={styles.cardDesc}>{system.description}</p>
        )}
      </article>
    );
  }

  // Light Mode Card: Original classic design with ExternalLink button and right-aligned text
  return (
    <article className={`${styles.card} ${isFav ? styles.cardFav : ''}`}>
      <button
        type="button"
        className={`${styles.starBtn} ${isFav ? styles.starFavActive : ''}`}
        onClick={handleToggleStar}
        aria-label={isFav ? `הסר את ${system.name} ממועדפים` : `הוסף את ${system.name} למועדפים`}
        title={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
      >
        <Star size={17} fill={isFav ? 'currentColor' : 'none'} />
      </button>

      <span className={styles.cardName}>{system.name}</span>
      {system.description && (
        <p className={styles.cardDesc}>{system.description}</p>
      )}
      <button
        type="button"
        className={styles.cardBtn}
        onClick={handleClick}
        aria-label={`פתח את ${system.name} בכרטיסייה חדשה`}
      >
        <ExternalLink size={13} aria-hidden="true" />
        פתח
      </button>
    </article>
  );
}

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [category, setCategory] = useState<MainCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void api.mainCategories.get(Number(id))
      .then((data) => { setCategory(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.skeletonPage} aria-label="טוען..." />
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className={styles.page}>
        <p className={styles.errorMsg}>שגיאה בטעינת הקטגוריה</p>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          חזרה לדף הבית
        </button>
      </main>
    );
  }

  const subCategories = category.subCategories ?? [];
  const totalSystems = subCategories.reduce((acc, sub) => acc + (sub.systems?.length ?? 0), 0);
  const allSystems = subCategories.flatMap((sub) => sub.systems ?? []);

  return (
    <main className={styles.page}>

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="חזרה">
          <ArrowRight size={15} aria-hidden="true" />
          חזרה
        </button>
        <h1 className={styles.title}>{category.name}</h1>
        {category.description && <p className={styles.subtitle}>{category.description}</p>}
        <span className={styles.badge}>{totalSystems} מערכות</span>
      </div>

      {totalSystems === 0 ? (
        <p className={styles.empty}>אין מערכות בקטגוריה זו</p>
      ) : isDark ? (
        /* Dark Mode: Single unified centered grid for all cards without subcategory dividers */
        <div className={styles.darkGridWrap}>
          <div className={styles.cardsGrid}>
            {allSystems.map((sys) => (
              <SystemCard key={sys.id} system={sys} isDark={true} />
            ))}
          </div>
        </div>
      ) : (
        /* Light Mode: Original structure grouped by subcategories */
        subCategories.map((sub) => (
          <section key={sub.id} className={styles.subSection}>
            <h2 className={styles.subTitle}>{sub.name}</h2>
            {!sub.systems || sub.systems.length === 0 ? (
              <p className={styles.empty}>אין מערכות</p>
            ) : (
              <div className={styles.cardsGrid}>
                {sub.systems.map((sys) => (
                  <SystemCard key={sys.id} system={sys} isDark={false} />
                ))}
              </div>
            )}
          </section>
        ))
      )}

    </main>
  );
}
