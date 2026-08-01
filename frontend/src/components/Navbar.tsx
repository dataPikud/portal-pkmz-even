import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Bell, User, ChevronDown, Home, Pencil } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useEditModeStore } from '../store/useEditModeStore';
import { NotificationsDropdown } from './NotificationsDropdown';
import styles from './Navbar.module.css';

export interface Breadcrumb {
  label: string;
  path?: string;
  onClick?: () => void;
}

interface NavbarProps {
  breadcrumbs: Breadcrumb[];
  
  // Optional search bindings
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;

  // Optional filter bindings
  filterOptions?: { id: number | string; name: string }[];
  selectedFilterId?: number | string | null;
  onFilterSelect?: (id: number | string | null) => void;
}

export function Navbar({
  breadcrumbs,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'חיפוש...',
  filterOptions = [],
  selectedFilterId = null,
  onFilterSelect,
}: NavbarProps) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const isEditMode = useEditModeStore((s) => s.isEditMode);
  const toggleEditMode = useEditModeStore((s) => s.toggleEditMode);
  const canManageContent = Boolean(user?.isAdmin || user?.isContentAdmin);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <nav className={styles.navbar} role="navigation" aria-label="ניווט עליון">
      {/* שמאל: Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <button
          className={styles.homeBtn}
          onClick={() => navigate('/')}
          aria-label="עמוד הבית"
          title="חזרה לדף הבית"
        >
          <Home size={18} />
        </button>
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const isClickable = !isLast && (Boolean(crumb.onClick) || Boolean(crumb.path));

          return (
            <div key={idx} className={styles.crumbWrapper}>
              <span className={styles.separator}>&gt;</span>
              {isClickable ? (
                <button
                  className={styles.crumbLink}
                  onClick={() => {
                    if (crumb.onClick) {
                      crumb.onClick();
                    } else if (crumb.path) {
                      navigate(crumb.path);
                    }
                  }}
                  title={`עבור אל ${crumb.label}`}
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={styles.crumbActive}>{crumb.label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ימין: חיפוש, סינון, התראות, פרופיל */}
      <div className={styles.actions}>
        {/* חיפוש */}
        {onSearchChange !== undefined && (
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="חיפוש"
            />
          </div>
        )}

        {/* סינון */}
        {onFilterSelect !== undefined && filterOptions.length > 0 && (
          <div className={styles.dropdownContainer} ref={filterRef}>
            <button
              className={`${styles.actionBtn} ${showFilterMenu || selectedFilterId !== null ? styles.actionBtnActive : ''}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              aria-label="סינון"
            >
              <Filter size={16} />
              <span>סינון</span>
            </button>

            {showFilterMenu && (
              <div className={styles.filterMenu}>
                <button
                  className={`${styles.filterItem} ${selectedFilterId === null ? styles.filterItemActive : ''}`}
                  onClick={() => {
                    onFilterSelect(null);
                    setShowFilterMenu(false);
                  }}
                >
                  הכל
                </button>
                {filterOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.filterItem} ${selectedFilterId === opt.id ? styles.filterItemActive : ''}`}
                    onClick={() => {
                      onFilterSelect(opt.id);
                      setShowFilterMenu(false);
                    }}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* מתג מצב עריכה למנהלים */}
        {canManageContent && (
          <button
            className={`${styles.editModeToggleBtn} ${isEditMode ? styles.editModeActive : ''}`}
            onClick={toggleEditMode}
            title={isEditMode ? 'כבה מצב עריכה' : 'הפעל מצב עריכה ישיר מתוך המסך'}
          >
            <Pencil size={15} />
            <span>{isEditMode ? 'מצב עריכה: מופעל' : 'מצב עריכה'}</span>
          </button>
        )}

        {/* פעמון התראות */}
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

        {/* פרופיל משתמש */}
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
    </nav>
  );
}
