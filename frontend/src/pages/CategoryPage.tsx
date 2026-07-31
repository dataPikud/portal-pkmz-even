import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
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
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { PageLoader } from '../components/PageLoader';
import { useSmartLoader } from '../hooks/useSmartLoader';
import type { MainCategory, System } from '../types';
import styles from './CategoryPage.module.css';

// Dynamic fallback icons & gradient backdrops for systems without an imageUrl
function getSystemFallbackIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('דואר') || n.includes('מייל') || n.includes('mail')) {
    return { Icon: Mail, gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)', color: '#f59e0b' };
  }
  if (n.includes('שירות') || n.includes('אישי') || n.includes('עובדים') || n.includes('פרופיל')) {
    return { Icon: User, gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(126, 34, 206, 0.2) 100%)', color: '#a855f7' };
  }
  if (n.includes('ישיבות') || n.includes('וידאו') || n.includes('שיחות') || n.includes('meeting')) {
    return { Icon: Video, gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.2) 100%)', color: '#3b82f6' };
  }
  if (n.includes('sharepoint') || n.includes('שת"פ') || n.includes('מסמכים') || n.includes('שיתוף')) {
    return { Icon: Share2, gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 116, 144, 0.2) 100%)', color: '#06b6d4' };
  }
  if (n.includes('דוחות') || n.includes('אנליטיקה') || n.includes('bi') || n.includes('נתונים')) {
    return { Icon: BarChart3, gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(4, 120, 87, 0.2) 100%)', color: '#10b981' };
  }
  if (n.includes('כוח אדם') || n.includes('משאבי אנוש') || n.includes('גיוס')) {
    return { Icon: Users, gradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(15, 118, 110, 0.2) 100%)', color: '#14b8a6' };
  }
  if (n.includes('תבל"ל') || n.includes('אבטחה') || n.includes('גישות') || n.includes('סייבר')) {
    return { Icon: ShieldCheck, gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(21, 128, 61, 0.2) 100%)', color: '#22c55e' };
  }
  if (n.includes('לוגיסטיקה') || n.includes('משלוחים') || n.includes('רכש')) {
    return { Icon: Truck, gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(194, 65, 12, 0.2) 100%)', color: '#f97316' };
  }
  if (n.includes('מודיעין') || n.includes('מטרה') || n.includes('איסוף')) {
    return { Icon: Target, gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)', color: '#ef4444' };
  }
  if (n.includes('אימונים') || n.includes('כושר') || n.includes('הדרכה')) {
    return { Icon: Dumbbell, gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(67, 56, 202, 0.2) 100%)', color: '#6366f1' };
  }
  if (n.includes('תמיכה') || n.includes('helpdesk')) {
    return { Icon: HelpCircle, gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(190, 24, 93, 0.2) 100%)', color: '#ec4899' };
  }
  if (n.includes('שרת') || n.includes('ניטור') || n.includes('תשתיות')) {
    return { Icon: Server, gradient: 'linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(51, 65, 85, 0.2) 100%)', color: '#64748b' };
  }
  if (n.includes('כספים') || n.includes('תקציב')) {
    return { Icon: DollarSign, gradient: 'linear-gradient(135deg, rgba(132, 204, 22, 0.2) 0%, rgba(77, 124, 15, 0.2) 100%)', color: '#84cc16' };
  }
  if (n.includes('נהלים') || n.includes('ידע') || n.includes('ספרייה')) {
    return { Icon: BookOpen, gradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.2) 0%, rgba(146, 64, 14, 0.2) 100%)', color: '#d97706' };
  }

  return { Icon: Globe, gradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(3, 105, 161, 0.2) 100%)', color: '#0ea5e9' };
}

function SystemCard({ system, categoryColor }: { system: System; categoryColor: string }) {
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

  return (
    <article
      className={`${styles.card} ${isFav ? styles.cardFav : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      style={{ '--card-glow': categoryColor } as React.CSSProperties}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`פתח את ${system.name}`}
    >
      {/* Star button on top right of the card */}
      <button
        type="button"
        className={`${styles.starBtn} ${isFav ? styles.starFavActive : ''}`}
        onClick={handleToggleStar}
        aria-label={isFav ? `הסר את ${system.name} ממועדפים` : `הוסף את ${system.name} למועדפים`}
        title={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
      >
        <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
      </button>

      {/* App logo/fallback icon in glass circular box */}
      <div className={styles.imageContainer} style={{ background: system.imageUrl ? undefined : fallback.gradient }}>
        {system.imageUrl ? (
          <img src={system.imageUrl} alt={system.name} className={styles.systemImg} />
        ) : (
          <FallbackIcon size={28} color={fallback.color} aria-hidden="true" />
        )}
      </div>

      {/* App name and description */}
      <h3 className={styles.cardName}>{system.name}</h3>
      {system.description && (
        <p className={styles.cardDesc}>{system.description}</p>
      )}
    </article>
  );
}

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<MainCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterId, setSelectedFilterId] = useState<number | string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Reset search & filter on category change
    setSearchQuery('');
    setSelectedFilterId(null);

    void api.mainCategories.get(Number(id))
      .then((data) => {
        setCategory(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  // List of all systems in this category
  const allSystems = useMemo(() => {
    if (!category) return [];
    return (category.subCategories ?? []).flatMap((sub) => sub.systems ?? []);
  }, [category]);

  // Filtered systems based on search and subcategory filters
  const filteredSystems = useMemo(() => {
    let result = allSystems;

    // Filter by subcategory
    if (selectedFilterId !== null) {
      result = result.filter(sys => sys.subCategoryId === Number(selectedFilterId));
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        sys =>
          sys.name.toLowerCase().includes(q) ||
          (sys.description ?? '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [allSystems, selectedFilterId, searchQuery]);

  const filterOptions = useMemo(() => {
    if (!category) return [];
    return (category.subCategories ?? []).map(sub => ({
      id: sub.id,
      name: sub.name
    }));
  }, [category]);

  const { showLoader } = useSmartLoader(loading, { delayMs: 2000, minVisibleMs: 5000 });

  if (showLoader) {
    return (
      <div className={styles.layoutContainer}>
        <Sidebar />
        <div className={styles.contentArea}>
          <PageLoader fullScreen message="טוען את המערכות..." />
        </div>
      </div>
    );
  }

  // Fast load window (loading is still true, but showLoader is false)
  if (loading) {
    return (
      <div className={styles.layoutContainer}>
        <Sidebar />
        <div className={styles.contentArea}>
          <Navbar breadcrumbs={[{ label: '...' }]} />
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className={styles.layoutContainer}>
        <Sidebar />
        <div className={styles.contentArea}>
          <div className={styles.errorWrapper}>
            <p className={styles.errorMsg}>שגיאה בטעינת הקטגוריה</p>
            <button className={styles.backBtn} onClick={() => navigate('/')}>
              חזרה לדף הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryColor = category.color || '#3b82f6';

  return (
    <div className={styles.layoutContainer}>
      {/* Right-aligned Sidebar */}
      <Sidebar />

      {/* Left Content Area */}
      <div className={styles.contentArea}>
        {/* Navbar */}
        <Navbar
          breadcrumbs={[{ label: category.name }]}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="חיפוש במדור..."
          filterOptions={filterOptions}
          selectedFilterId={selectedFilterId}
          onFilterSelect={setSelectedFilterId}
        />

        {/* Main Content Grid */}
        <main className={styles.mainContent}>
          {filteredSystems.length === 0 ? (
            <div className={styles.empty}>
              <p>לא נמצאו מערכות מתאימות</p>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {filteredSystems.map((sys) => (
                <SystemCard
                  key={sys.id}
                  system={sys}
                  categoryColor={categoryColor}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
