import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Film, Settings, Globe, Headphones, Bell, User, ChevronDown, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationsDropdown } from '../components/NotificationsDropdown';
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

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [now] = useState(new Date());

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

  function handleContactClick() {
    window.dispatchEvent(new CustomEvent('open-contact-form'));
  }

  // Format dynamic dates
  const gregorianDate = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  const hebrewDate = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  const formattedDate = `${gregorianDate} | ${hebrewDate}`;

  return (
    <main className={styles.page}>
      {/* Header Row */}
      <header className={styles.header}>
        {/* ימין: פניה, פעמון, משתמש */}
        <div className={styles.actions}>
          <button
            className={styles.contactBtn}
            onClick={handleContactClick}
            aria-label="פנייה למנהל מערכת"
          >
            <Headphones size={15} />
            <span>פנייה למנהל מערכת</span>
          </button>

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
              {/* Glowing Icon Top Center */}
              <div className={styles.cardIconCircle}>
                <IconComponent size={24} />
              </div>

              {/* Title & Desc */}
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.description}</p>

              {/* Entry arrow button (bottom left in RTL) */}
              <div className={styles.cardEntryBtn} aria-hidden="true">
                <ArrowLeft size={16} />
              </div>
            </button>
          );
        })}
      </section>
    </main>
  );
}
