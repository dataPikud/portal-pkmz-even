import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Film, Settings, Globe, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Sidebar.module.css';
import pakmazLogo from '../assets/PakmazLogo.svg.png';
import pakmazTikshuvLogo from '../assets/PakmazTikshuvLogo.svg.png';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    // Trigger custom event to notify parent containers of sidebar resize
    window.dispatchEvent(new Event('sidebar-resize'));
  }, [isCollapsed]);

  const menuItems = [
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

  function handleContactClick() {
    window.dispatchEvent(new CustomEvent('open-contact-form'));
  }

  const activeItem = menuItems.find(item => {
    if (item.path === '/content') {
      return location.pathname === '/content';
    }
    return location.pathname === item.path;
  });

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`} aria-label="תפריט ראשי">
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

      {/* Footer / Utilities */}
      <div className={styles.footer}>
        <button
          className={styles.contactBtn}
          onClick={handleContactClick}
          title="פנייה למנהל מערכת"
        >
          <Headphones size={20} className={styles.navIcon} />
          {!isCollapsed && <span className={styles.navLabel}>פנייה למנהל מערכת</span>}
        </button>

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
  );
}
