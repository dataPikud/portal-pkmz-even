import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Film, Settings, Globe, Bell, User, ChevronDown, ArrowLeft, Star,
  Mail, Video as VideoIcon, Share2, Users, ShieldCheck, Truck, Target, Dumbbell, HelpCircle,
  Server, DollarSign, BookOpen, ExternalLink, Play, Clock
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useSmartLoader } from '../hooks/useSmartLoader';
import { NotificationsDropdown } from '../components/NotificationsDropdown';
import { Sidebar } from '../components/Sidebar';
import { VideoModal } from '../components/VideoModal';
import { PageLoader } from '../components/PageLoader';
import { api } from '../lib/api';
import type { System, Video } from '../types';
import styles from './HomePage.module.css';
import pakmazLogo from '../assets/PakmazLogo.svg.png';
import pakmazTikshuvLogo from '../assets/PakmazTikshuvLogo.svg.png';

interface CardData {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<any>;
  themeClass: string;
}

function getSystemFallbackIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('דואר') || n.includes('מייל') || n.includes('mail')) {
    return { Icon: Mail, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' };
  }
  if (n.includes('שירות') || n.includes('אישי') || n.includes('עובדים') || n.includes('פרופיל')) {
    return { Icon: User, gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', color: '#fff' };
  }
  if (n.includes('ישיבות') || n.includes('וידאו') || n.includes('שיחות') || n.includes('meeting')) {
    return { Icon: VideoIcon, gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff' };
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

function formatDuration(secs: number | null | undefined): string {
  if (!secs || secs <= 0) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [loading, setLoading] = useState(true);
  const { showLoader, isContentReady } = useSmartLoader(loading, { delayMs: 2000, minVisibleMs: 5000 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [systems, setSystems] = useState<System[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const favorites = useFavoritesStore(s => s.favorites);
  const videoFavorites = useFavoritesStore(s => s.videoFavorites);
  const toggleFavorite = useFavoritesStore(s => s.toggleFavorite);
  const toggleVideoFavorite = useFavoritesStore(s => s.toggleVideoFavorite);

  const [favTab, setFavTab] = useState<'all' | 'systems' | 'videos'>('all');
  const [now] = useState(new Date());

  // Fetch data cleanly with loading state
  useEffect(() => {
    setLoading(true);
    Promise.all([api.systems.list(), api.videos.list()])
      .then(([sysData, vidData]) => {
        setSystems(sysData);
        setVideos(vidData);
      })
      .catch((e) => {
        console.error('Failed to load portal data:', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const cards: CardData[] = [
    {
      id: 'net',
      title: 'אפליקציות ברשת',
      description: 'אפליקציות ושירותים ברשת',
      path: '/category/3',
      icon: Globe,
      themeClass: styles.goldCard,
    },
    {
      id: 'ops',
      title: 'מערכות תפעול',
      description: 'מערכות ושירותים תפעוליים',
      path: '/category/2',
      icon: Settings,
      themeClass: styles.greenCard,
    },
    {
      id: 'content',
      title: 'חומרי הטמעה',
      description: 'חומרים, נהלים והדרכות',
      path: '/content',
      icon: Film,
      themeClass: styles.purpleCard,
    },
    {
      id: 'dashboards',
      title: 'דשבורדים',
      description: 'סקירות, נתונים ומדדים',
      path: '/category/1',
      icon: BarChart3,
      themeClass: styles.blueCard,
    },
  ];

  const formattedDate = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  const favoriteSystems = systems.filter(sys => favorites.includes(sys.id));
  const favoriteVideos = videos.filter(v => videoFavorites.includes(v.id));

  const totalFavsCount = favoriteSystems.length + favoriteVideos.length;

  function handleOpenSystem(sys: System) {
    void api.visits.record(sys.id);
    window.open(sys.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />

      <div className={styles.mainArea}>
        <main className={styles.page}>
          {/* Header Row */}
          <header className={styles.header}>
            {/* ימין: פעמון, משתמש */}
            <div className={styles.actions}>
              <div className={styles.dropdownContainer}>
                <button
                  className={`${styles.actionBtn} ${showNotifications ? styles.actionBtnActive : ''}`}
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="התראות"
                >
                  <div className={styles.bellIconWrap}>
                    <Bell size={18} />
                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                  </div>
                </button>

                {showNotifications && (
                  <NotificationsDropdown
                    onClose={() => setShowNotifications(false)}
                    onUnreadCountChange={setUnreadCount}
                  />
                )}
              </div>

              <div className={styles.dropdownContainer} ref={userMenuRef}>
                <button
                  className={styles.userProfileBtn}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="תפריט משתמש"
                >
                  <div className={styles.avatar}>
                    <User size={16} />
                  </div>
                  <span className={styles.username}>
                    שלום, {user?.displayName || 'משתמש'}
                  </span>
                  <ChevronDown size={14} className={styles.userChevron} />
                </button>

                {showUserMenu && (
                  <div className={styles.userMenu}>
                    <div className={styles.menuHeader}>
                      <p className={styles.userFullname}>{user?.displayName}</p>
                      <p className={styles.userEmail}>{user?.email}</p>
                      <p className={styles.userRole}>
                        {user?.isAdmin ? 'מנהל מערכת' : user?.isContentAdmin ? 'מנהל תוכן' : 'משתמש פורטל'}
                      </p>
                    </div>
                    {user?.isAdmin && (
                      <>
                        <hr className={styles.menuDivider} />
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            navigate('/admin');
                            setShowUserMenu(false);
                          }}
                        >
                          פאנל ניהול
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* מרכז: הודעת ברוכים הבאים */}
            <div className={styles.welcomeBlock}>
              <h1 className={styles.welcomeTitle}>ברוכים הבאים לפורטל פיקוד מרכז</h1>
              <p className={styles.welcomeDate}>{formattedDate}</p>
            </div>

            {/* שמאל: לוגו פיקוד מרכז ותוויות */}
            <div className={styles.brand}>
              <div className={styles.brandText}>
                <h2 className={styles.brandTitle}>פיקוד מרכז</h2>
                <p className={styles.brandSubtitle}>עליונות | חדשנות | ביטחון</p>
              </div>
              <div className={styles.logoGroup}>
                <img src={pakmazLogo} className={styles.headerLogo} alt="לוגו פקמז" />
                <img src={pakmazTikshuvLogo} className={styles.headerLogo} alt="לוגו תקשוב פקמז" />
              </div>
            </div>
          </header>

          {/* Grid of 4 categories */}
          <section className={styles.cardsGrid} aria-label="כרטיסי ניווט ראשיים">
            {cards.map((card) => {
              const IconComponent = card.icon;
              return (
                <button
                  key={card.id}
                  className={`${styles.card} ${card.themeClass}`}
                  onClick={() => navigate(card.path)}
                  aria-label={`עבור אל ${card.title}`}
                >
                  <div className={styles.cardIconCircle}>
                    <IconComponent size={24} />
                  </div>

                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p className={styles.cardDesc}>{card.description}</p>

                  <div className={styles.cardEntryBtn} aria-hidden="true">
                    <ArrowLeft size={14} />
                  </div>
                </button>
              );
            })}
          </section>

          {/* Favorites Section */}
          <section className={styles.favoritesSection} aria-label="מועדפים">
            <div className={styles.favSectionHeader}>
              <div className={styles.favTitleWrap}>
                <Star size={18} className={styles.favSectionStarIcon} fill="#f59e0b" color="#f59e0b" />
                <h2 className={styles.favSectionTitle}>מועדפים</h2>
                {!loading && totalFavsCount > 0 && (
                  <span className={styles.favBadge}>{totalFavsCount}</span>
                )}
              </div>

              {!loading && totalFavsCount > 0 && (
                <div className={styles.favTabs}>
                  <button
                    className={`${styles.favTabBtn} ${favTab === 'all' ? styles.favTabActive : ''}`}
                    onClick={() => setFavTab('all')}
                  >
                    הכל ({totalFavsCount})
                  </button>
                  <button
                    className={`${styles.favTabBtn} ${favTab === 'systems' ? styles.favTabActive : ''}`}
                    onClick={() => setFavTab('systems')}
                  >
                    מערכות ({favoriteSystems.length})
                  </button>
                  <button
                    className={`${styles.favTabBtn} ${favTab === 'videos' ? styles.favTabActive : ''}`}
                    onClick={() => setFavTab('videos')}
                  >
                    סרטונים ({favoriteVideos.length})
                  </button>
                </div>
              )}
            </div>

            {showLoader ? (
              <div className={styles.favLoaderWrap}>
                <PageLoader message="טוען את נתוני הפורטל..." />
              </div>
            ) : isContentReady && totalFavsCount === 0 ? (
              /* Display Empty Box ONLY after data is ready and totalFavsCount is 0 */
              <div className={styles.emptyFavsBox}>
                <div className={styles.emptyFavsIconWrap}>
                  <Star size={22} color="var(--muted)" />
                </div>
                <p className={styles.emptyFavsTitle}>עדיין לא סימנת מערכות או סרטונים במועדפים</p>
                <p className={styles.emptyFavsSub}>
                  לחץ על הכוכב בכרטיס המערכת או הסרטון כדי להוסיף למועדפים לגישה מהירה.
                </p>
              </div>
            ) : isContentReady ? (
              <div className={styles.favoritesGrid}>
                {/* Favorite Systems */}
                {(favTab === 'all' || favTab === 'systems') &&
                  favoriteSystems.map((sys) => {
                    const fallback = getSystemFallbackIcon(sys.name);
                    const FallbackIcon = fallback.Icon;
                    return (
                      <div
                        key={`sys-${sys.id}`}
                        className={styles.favCard}
                        onClick={() => handleOpenSystem(sys)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenSystem(sys);
                          }
                        }}
                        aria-label={`פתח את ${sys.name}`}
                      >
                        <button
                          type="button"
                          className={styles.favStarBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(sys.id);
                          }}
                          title="הסר ממועדפים"
                          aria-label={`הסר את ${sys.name} ממועדפים`}
                        >
                          <Star size={15} fill="#f59e0b" color="#f59e0b" />
                        </button>

                        <div
                          className={styles.favImgContainer}
                          style={{ background: sys.imageUrl ? undefined : fallback.gradient }}
                        >
                          {sys.imageUrl ? (
                            <img src={sys.imageUrl} alt={sys.name} className={styles.favImg} />
                          ) : (
                            <FallbackIcon size={20} color={fallback.color} aria-hidden="true" />
                          )}
                        </div>

                        <div className={styles.favInfo}>
                          <span className={styles.favTypeTag}>מערכת</span>
                          <h3 className={styles.favTitle}>{sys.name}</h3>
                          {sys.description && (
                            <p className={styles.favDesc}>{sys.description}</p>
                          )}
                        </div>

                        <ExternalLink size={14} className={styles.favExternalIcon} />
                      </div>
                    );
                  })}

                {/* Favorite Videos */}
                {(favTab === 'all' || favTab === 'videos') &&
                  favoriteVideos.map((video) => {
                    const durationStr = formatDuration(video.duration);
                    return (
                      <div
                        key={`vid-${video.id}`}
                        className={`${styles.favCard} ${styles.favVideoCard}`}
                        onClick={() => setActiveVideo(video)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveVideo(video);
                          }
                        }}
                        aria-label={`הפעל סרטון ${video.title}`}
                      >
                        <button
                          type="button"
                          className={styles.favStarBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVideoFavorite(video.id);
                          }}
                          title="הסר ממועדפים"
                          aria-label={`הסר את ${video.title} ממועדפים`}
                        >
                          <Star size={15} fill="#f59e0b" color="#f59e0b" />
                        </button>

                        <div className={styles.favVideoImgContainer}>
                          {video.thumbnailName ? (
                            <img
                              src={`/uploads/thumbnails/${encodeURIComponent(video.thumbnailName)}`}
                              alt={video.title}
                              className={styles.favImg}
                            />
                          ) : (
                            <Film size={20} color="#8b5cf6" />
                          )}
                          <div className={styles.favPlayOverlay}>
                            <Play size={14} fill="currentColor" />
                          </div>
                        </div>

                        <div className={styles.favInfo}>
                          <div className={styles.favHeaderRow}>
                            <span className={styles.favVideoTag}>סרטון</span>
                            {durationStr && (
                              <span className={styles.favDuration}>
                                <Clock size={10} />
                                {durationStr}
                              </span>
                            )}
                          </div>
                          <h3 className={styles.favTitle}>{video.title}</h3>
                          {video.description && (
                            <p className={styles.favDesc}>{video.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : null}
          </section>
        </main>
      </div>

      {/* Video Modal Popup */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}
