import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, BarChart3, Film, Settings, Globe, Shield, ChevronLeft, ChevronRight, Menu, X,
  Bell, User, Search
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationsDropdown } from './NotificationsDropdown';
import styles from './Sidebar.module.css';
import pakmazLogo from '../assets/PakmazLogo.svg.png';
import pakmazTikshuvLogo from '../assets/PakmazTikshuvLogo.svg.png';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(s => s.user);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileSearch, setMobileSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    window.dispatchEvent(new Event('sidebar-resize'));
  }, [isCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const menuItems = [
    {
      id: 'home',
      label: 'דף הבית',
      path: '/',
      icon: Home,
    },
    {
      id: 'dashboards',
      label: 'דשבורדים',
      path: '/category/1',
      icon: BarChart3,
    },
    {
      id: 'content',
      label: 'חומרי הטמעה',
      path: '/content',
      icon: Film,
    },
    {
      id: 'ops',
      label: 'מערכות תפעול',
      path: '/category/2',
      icon: Settings,
    },
    {
      id: 'net',
      label: 'אפליקציות ברשת',
      path: '/category/3',
      icon: Globe,
    },
  ];

  if (user?.isAdmin) {
    menuItems.push({
      id: 'admin',
      label: 'פאנל ניהול',
      path: '/admin',
      icon: Shield,
    });
  }

  const activeItem = menuItems.find(item => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  });

  function handleMobileSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mobileSearch.trim()) {
      navigate(`/content?search=${encodeURIComponent(mobileSearch.trim())}`);
      setMobileOpen(false);
      setMobileSearch('');
    }
  }

  return (
    <>
      {/* Mobile Top Bar with Bell Notification & Hamburger Menu */}
      <div className={styles.mobileTopBar}>
        <div className={styles.mobileBrand}>
          <img src={pakmazLogo} className={styles.mobileLogo} alt="לוגו פקמז" />
          <span className={styles.mobileBrandTitle}>פיקוד מרכז</span>
        </div>

        <div className={styles.mobileTopActions}>
          {/* Bell Notifications Button next to Hamburger */}
          <div className={styles.mobileNotifWrapper}>
            <button
              className={`${styles.mobileBellBtn} ${showNotifications ? styles.mobileBellActive : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="התראות"
              title="התראות"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {showNotifications && (
              <NotificationsDropdown
                onClose={() => setShowNotifications(false)}
                onUnreadCountChange={setUnreadCount}
              />
            )}
          </div>

          {/* Hamburger Menu Toggle */}
          <button
            className={styles.mobileHamburger}
            onClick={() => setMobileOpen(true)}
            aria-label="פתח תפריט"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer & Overlay */}
      {mobileOpen && (
        <>
          <div
            className={styles.mobileOverlay}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className={styles.mobileDrawer} aria-label="תפריט מובייל">
            {/* Header with Brand & Close X */}
            <div className={styles.drawerHeader}>
              <div className={styles.brandInfo}>
                <div className={styles.logoRow}>
                  <img src={pakmazLogo} className={styles.logo} alt="לוגו פקמז" />
                  <img src={pakmazTikshuvLogo} className={styles.logo} alt="לוגו תקשוב" />
                </div>
                <h2 className={styles.brandTitle}>פיקוד מרכז</h2>
                <p className={styles.brandSubtitle}>עליונות | חדשנות | ביטחון</p>
              </div>
              <button
                className={styles.closeDrawerBtn}
                onClick={() => setMobileOpen(false)}
                aria-label="סגור תפריט"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile User Profile Section in Drawer */}
            <div className={styles.drawerUserCard}>
              <div className={styles.drawerUserAvatar}>
                <User size={20} />
              </div>
              <div className={styles.drawerUserInfo}>
                <span className={styles.drawerUserName}>
                  {user?.displayName || 'משתמש פורטל'}
                </span>
                <span className={styles.drawerUserRole}>
                  {user?.isAdmin ? 'מנהל מערכת' : user?.isContentAdmin ? 'מנהל תוכן' : 'משתמש פורטל'}
                </span>
              </div>
            </div>

            {/* Mobile Search Bar inside Drawer */}
            <form onSubmit={handleMobileSearchSubmit} className={styles.drawerSearchForm}>
              <div className={styles.drawerSearchWrap}>
                <Search size={16} className={styles.drawerSearchIcon} />
                <input
                  type="text"
                  className={styles.drawerSearchInput}
                  placeholder="חיפוש במערכת..."
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                />
              </div>
            </form>

            {/* Nav Menu */}
            <nav className={styles.nav} aria-label="ניווט מובייל">
              <ul className={styles.navList}>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem?.id === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                        onClick={() => {
                          navigate(item.path);
                          setMobileOpen(false);
                        }}
                      >
                        <Icon size={20} className={styles.navIcon} />
                        <span className={styles.navLabel}>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
        aria-label="תפריט ראשי"
      >
        {/* Logos and Headers */}
        <div className={styles.header}>
          <div className={styles.logoRow}>
            <img src={pakmazLogo} className={styles.logo} alt="לוגו פקמז" />
            <img src={pakmazTikshuvLogo} className={styles.logo} alt="לוגו תקשוב פקמז" />
          </div>
          {!isCollapsed && (
            <div className={styles.brandInfo}>
              <h2 className={styles.brandTitle}>פיקוד מרכז</h2>
              <p className={styles.brandSubtitle}>עליונות | חדשנות | ביטחון</p>
            </div>
          )}
        </div>

        {/* Nav List */}
        <nav className={styles.nav} aria-label="ניווט צד">
          <ul className={styles.navList}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                    onClick={() => navigate(item.path)}
                    title={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={20} className={styles.navIcon} />
                    {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Collapse Toggle */}
        <div className={styles.footer}>
          <button
            className={styles.collapseBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
          >
            {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {!isCollapsed && <span className={styles.collapseText}>כווץ תפריט</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
