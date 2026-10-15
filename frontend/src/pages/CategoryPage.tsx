import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Folder as FolderIcon,
  ChevronLeft,
  Film,
  Play,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useAuthStore } from '../store/useAuthStore';
import { useEditModeStore } from '../store/useEditModeStore';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { PageLoader } from '../components/PageLoader';
import { TagSearchModal } from '../components/TagSearchModal';
import { VideoModal } from '../components/VideoModal';
import { SystemModal } from '../components/admin/SystemModal';
import { FolderModal } from '../components/admin/FolderModal';
import { useSmartLoader } from '../hooks/useSmartLoader';
import type { MainCategory, System, CategoryFolder, Video as VideoType } from '../types';
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

interface SystemCardProps {
  system: System;
  onTagClick: (tag: string) => void;
  isEditMode?: boolean;
  onEdit?: (sys: System) => void;
  onDelete?: (id: number) => void;
}

function SystemCard({ system, onTagClick, isEditMode, onEdit, onDelete }: SystemCardProps) {
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
    >
      {/* Top right favorite star button */}
      <button
        type="button"
        className={`${styles.favStarBtn} ${isFav ? styles.starFavActive : ''}`}
        onClick={handleToggleStar}
        title={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
      >
        <Star
          size={18}
          fill={isFav ? '#f59e0b' : 'none'}
          color={isFav ? '#f59e0b' : '#94a3b8'}
        />
      </button>

      {/* Admin Quick Action Overlay when Edit Mode is ON */}
      {isEditMode && (
        <div className={styles.adminCardOverlay}>
          {onEdit && (
            <button
              className={styles.adminActionBtn}
              onClick={e => { e.stopPropagation(); onEdit(system); }}
              title="ערוך מערכת"
            >
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              className={`${styles.adminActionBtn} ${styles.adminDeleteBtn}`}
              onClick={e => { e.stopPropagation(); onDelete(system.id); }}
              title="מחק מערכת"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {/* Top Center Thumbnail / Icon Box */}
      <div
        className={styles.cardIconBox}
        style={{
          background: system.imageUrl ? 'transparent' : fallback.gradient,
        }}
      >
        {system.imageUrl ? (
          <img
            src={system.imageUrl}
            alt={system.name}
            className={styles.cardImage}
          />
        ) : (
          <FallbackIcon size={26} color={fallback.color} />
        )}
      </div>

      {/* Card Content */}
      <h3 className={styles.cardTitle}>{system.name}</h3>
      {system.description && (
        <p className={styles.cardDesc}>{system.description}</p>
      )}

      {/* Tags Chips */}
      {system.tags && system.tags.length > 0 && (
        <div className={styles.tagWrap} onClick={e => e.stopPropagation()}>
          {system.tags.map(tag => (
            <span
              key={tag}
              className={styles.tagPill}
              onClick={() => onTagClick(tag)}
              title={`סנן לפי תגית #${tag}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeFolderId = searchParams.get('folder') ? Number(searchParams.get('folder')) : null;

  const [category, setCategory] = useState<MainCategory | null>(null);
  const [currentFolder, setCurrentFolder] = useState<CategoryFolder | null>(null);
  const [subFolders, setSubFolders] = useState<CategoryFolder[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);

  const [allFoldersTree, setAllFoldersTree] = useState<CategoryFolder[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagModal, setActiveTagModal] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<VideoType | null>(null);

  // In-Context Edit Mode
  const user = useAuthStore(s => s.user);
  const isEditMode = useEditModeStore(s => s.isEditMode);
  const canManageContent = Boolean(user?.isAdmin || user?.isContentAdmin);

  const [systemModalTarget, setSystemModalTarget] = useState<System | null | 'NEW'>(null);
  const [folderModalTarget, setFolderModalTarget] = useState<CategoryFolder | null | 'NEW'>(null);

  const { showLoader } = useSmartLoader(loading, { delayMs: 2000, minVisibleMs: 5000 });

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    const categoryId = Number(id);

    Promise.all([
      api.mainCategories.list(),
      api.folders.tree(),
    ]).then(([cats, tree]) => {
      setMainCategories(cats);
      setAllFoldersTree(tree);
    });

    if (activeFolderId) {
      Promise.all([
        api.mainCategories.get(categoryId),
        api.folders.get(activeFolderId),
      ])
        .then(([catData, folderData]) => {
          setCategory(catData);
          setCurrentFolder(folderData);
          setSubFolders(folderData.children ?? []);
          setSystems(folderData.systems ?? []);
          setVideos(folderData.videos ?? []);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    } else {
      api.mainCategories.get(categoryId)
        .then((catData) => {
          setCategory(catData);
          setCurrentFolder(null);
          setSubFolders(catData.folders ?? []);
          setSystems(catData.systems ?? []);
          setVideos(catData.videos ?? []);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [id, activeFolderId]);

  async function handleDeleteSystem(sysId: number) {
    if (!confirm('האם למחוק את המערכת?')) return;
    try {
      await api.systems.delete(sysId);
      loadData();
    } catch {
      alert('מחיקת המערכת נכשלה');
    }
  }

  async function handleDeleteFolder(foldId: number) {
    if (!confirm('האם למחוק את התיקייה? (כל תת-התיקיות יימחקו)')) return;
    try {
      await api.folders.delete(foldId);
      loadData();
    } catch {
      alert('מחיקת התיקייה נכשלה');
    }
  }

  const filteredSystems = useMemo(() => {
    if (!searchQuery.trim()) return systems;
    const q = searchQuery.trim().toLowerCase();
    return systems.filter(
      s => s.name.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [systems, searchQuery]);

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return subFolders;
    const q = searchQuery.trim().toLowerCase();
    return subFolders.filter(
      f => f.name.toLowerCase().includes(q) || (f.description ?? '').toLowerCase().includes(q)
    );
  }, [subFolders, searchQuery]);

  // Construct Breadcrumbs Trail
  const breadcrumbs = useMemo(() => {
    if (!category) return [];
    const crumbs = [{ label: category.name, onClick: () => setSearchParams({}) }];
    if (currentFolder && currentFolder.breadcrumbs) {
      currentFolder.breadcrumbs.forEach((b) => {
        crumbs.push({
          label: b.name,
          onClick: () => setSearchParams({ folder: String(b.id) }),
        });
      });
    }
    return crumbs;
  }, [category, currentFolder, setSearchParams]);

  if (showLoader) {
    return (
      <div className={styles.layoutContainer}>
        <Sidebar />
        <div className={styles.contentArea}>
          <PageLoader fullScreen message="טוען את המערכות והתיקיות..." />
        </div>
      </div>
    );
  }

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

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />

      <div className={styles.contentArea}>
        <Navbar
          breadcrumbs={breadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="חיפוש בתיקייה או לפי תג..."
        />

        <main className={styles.mainContent}>
          {/* Action Bar when Edit Mode is ON */}
          {isEditMode && canManageContent && (
            <div className={styles.inContextActionBar}>
              <div className={styles.actionBarTitle}>
                <span>✏️ מצב עריכה ישיר פעיל בתיקייה זו</span>
              </div>
              <div className={styles.actionBarBtns}>
                <button
                  className={styles.addContextBtn}
                  onClick={() => setSystemModalTarget('NEW')}
                >
                  <Plus size={14} /> הוסף מערכת לתיקייה זו
                </button>
                <button
                  className={`${styles.addContextBtn} ${styles.addFolderBtn}`}
                  onClick={() => setFolderModalTarget('NEW')}
                >
                  <Plus size={14} /> הוסף תת-תיקייה
                </button>
              </div>
            </div>
          )}

          {/* Folders Section */}
          {filteredFolders.length > 0 && (
            <section className={styles.sectionWrap}>
              <div className={styles.sectionHeader}>
                <FolderIcon size={18} color="#f59e0b" />
                <h2 className={styles.sectionTitle}>תיקיות ({filteredFolders.length})</h2>
              </div>
              <div className={styles.foldersGrid}>
                {filteredFolders.map(folder => {
                  const itemCount = (folder._count?.systems ?? 0) + (folder._count?.videos ?? 0) + (folder._count?.children ?? 0);
                  return (
                    <div
                      key={folder.id}
                      className={styles.folderCard}
                      onClick={() => setSearchParams({ folder: String(folder.id) })}
                    >
                      {isEditMode && canManageContent && (
                        <div className={styles.adminCardOverlay}>
                          <button
                            className={styles.adminActionBtn}
                            onClick={e => { e.stopPropagation(); setFolderModalTarget(folder); }}
                            title="ערוך תיקייה"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className={`${styles.adminActionBtn} ${styles.adminDeleteBtn}`}
                            onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                            title="מחק תיקייה"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}

                      <div className={styles.folderIconWrap}>
                        {folder.imageUrl ? (
                          <img src={folder.imageUrl} alt={folder.name} className={styles.folderImg} />
                        ) : (
                          <FolderIcon size={32} color="#f59e0b" />
                        )}
                      </div>
                      <div className={styles.folderInfo}>
                        <h3 className={styles.folderName}>{folder.name}</h3>
                        {folder.description && <p className={styles.folderDesc}>{folder.description}</p>}
                      </div>
                      {itemCount > 0 && (
                        <span className={styles.itemCountBadge}>{itemCount} פריטים</span>
                      )}
                      <ChevronLeft size={18} className={styles.folderArrow} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Systems Section */}
          {filteredSystems.length > 0 && (
            <section className={styles.sectionWrap}>
              <div className={styles.sectionHeader}>
                <Globe size={18} color="#3b82f6" />
                <h2 className={styles.sectionTitle}>מערכות ואתרים ({filteredSystems.length})</h2>
              </div>
              <div className={styles.cardsGrid}>
                {filteredSystems.map(sys => (
                  <SystemCard
                    key={sys.id}
                    system={sys}
                    isEditMode={isEditMode && canManageContent}
                    onEdit={s => setSystemModalTarget(s)}
                    onDelete={handleDeleteSystem}
                    onTagClick={tag => setActiveTagModal(tag)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Videos Section */}
          {videos.length > 0 && (
            <section className={styles.sectionWrap}>
              <div className={styles.sectionHeader}>
                <Film size={18} color="#a855f7" />
                <h2 className={styles.sectionTitle}>סרטוני הדרכה ({videos.length})</h2>
              </div>
              <div className={styles.cardsGrid}>
                {videos.map(v => (
                  <div
                    key={v.id}
                    className={styles.card}
                    onClick={() => setActiveVideoModal(v)}
                    style={{ minHeight: 180, cursor: 'pointer' }}
                  >
                    <div className={styles.cardIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                      <Play size={24} color="#a855f7" />
                    </div>
                    <h3 className={styles.cardTitle}>{v.title}</h3>
                    {v.description && <p className={styles.cardDesc}>{v.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredSystems.length === 0 && filteredFolders.length === 0 && videos.length === 0 && (
            <div className={styles.empty}>
              <p>אין תוכן בתיקייה זו עדיין.</p>
            </div>
          )}
        </main>
      </div>

      {/* Modals for In-Context Editing */}
      {systemModalTarget && (
        <SystemModal
          system={systemModalTarget === 'NEW' ? null : systemModalTarget}
          defaultFolderId={activeFolderId}
          folders={allFoldersTree}
          mainCategories={mainCategories}
          onClose={() => setSystemModalTarget(null)}
          onSave={loadData}
        />
      )}

      {folderModalTarget && (
        <FolderModal
          folder={folderModalTarget === 'NEW' ? null : folderModalTarget}
          defaultParentId={activeFolderId}
          defaultMainCategoryId={category ? category.id : Number(id)}
          folders={allFoldersTree}
          mainCategories={mainCategories}
          onClose={() => setFolderModalTarget(null)}
          onSave={loadData}
        />
      )}

      {activeTagModal && (
        <TagSearchModal
          tag={activeTagModal}
          onClose={() => setActiveTagModal(null)}
        />
      )}

      {activeVideoModal && (
        <VideoModal
          video={activeVideoModal}
          onClose={() => setActiveVideoModal(null)}
        />
      )}
    </div>
  );
}
