import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Film, Folder as FolderIcon, BarChart3, Globe, Bell, LayoutGrid } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { PageLoader } from '../components/PageLoader';
import { useSmartLoader } from '../hooks/useSmartLoader';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { SystemModal } from '../components/admin/SystemModal';
import { FolderModal } from '../components/admin/FolderModal';
import { VideoModalEdit } from '../components/admin/VideoModalEdit';
import { NotificationModal } from '../components/admin/NotificationModal';
import type { MainCategory, CategoryFolder, System, Video, SystemNotification } from '../types';
import styles from './AdminPage.module.css';

export function AdminPage() {
  const user = useAuthStore(s => s.user);

  const isAdmin = user?.isAdmin;

  const [activeTab, setActiveTab] = useState<'explorer' | 'analytics' | 'notifications'>('explorer');

  const [systems, setSystems] = useState<System[]>([]);
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [folders, setFolders] = useState<CategoryFolder[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Explorer active selection
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const { showLoader } = useSmartLoader(loading, { delayMs: 2000, minVisibleMs: 5000 });

  // Modal control states
  const [systemModalTarget, setSystemModalTarget] = useState<System | null | 'NEW'>(null);
  const [folderModalTarget, setFolderModalTarget] = useState<CategoryFolder | null | 'NEW'>(null);
  const [videoModalTarget, setVideoModalTarget] = useState<Video | null | 'NEW'>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Search filter
  const [filterQuery, setFilterQuery] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.systems.list(),
      api.mainCategories.list(),
      api.folders.tree(),
      api.videos.listAll(),
      api.notifications.list(),
    ])
      .then(([sysRes, catRes, foldRes, vidRes, notifRes]) => {
        setSystems(sysRes);
        setCategories(catRes);
        setFolders(foldRes);
        setVideos(vidRes);
        setNotifications(notifRes);

        // Default selection to first category
        if (catRes.length > 0 && selectedCatId === null && selectedFolderId === null) {
          setSelectedCatId(catRes[0].id);
        }
      })
      .catch(err => console.error('Failed to load admin data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // System Delete
  async function handleDeleteSystem(id: number) {
    if (!confirm('האם למחוק את המערכת?')) return;
    try {
      await api.systems.delete(id);
      loadData();
    } catch {
      alert('מחיקת המערכת נכשלה');
    }
  }

  // Folder Delete
  async function handleDeleteFolder(id: number) {
    if (!confirm('האם למחוק את התיקייה? (כל תת-התיקיות יימחקו)')) return;
    try {
      await api.folders.delete(id);
      loadData();
    } catch {
      alert('מחיקת התיקייה נכשלה');
    }
  }

  // Video Delete
  async function handleDeleteVideo(id: number) {
    if (!confirm('האם למחוק את סרטון ההדרכה?')) return;
    try {
      await api.videos.delete(id);
      loadData();
    } catch {
      alert('מחיקת הסרטון נכשלה');
    }
  }

  // Notification Delete
  async function handleDeleteNotification(id: number) {
    if (!confirm('האם למחוק את הודעת המערכת?')) return;
    try {
      await api.notifications.delete(id);
      loadData();
    } catch {
      alert('מחיקת ההודעה נכשלה');
    }
  }

  // Filter systems & videos for the selected node
  const activeSystems = useMemo(() => {
    let result = systems;
    if (selectedFolderId !== null) {
      result = systems.filter(s => s.folderId === selectedFolderId);
    } else if (selectedCatId !== null) {
      result = systems.filter(s => s.folder?.mainCategoryId === selectedCatId || !s.folderId);
    }
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)));
    }
    return result;
  }, [systems, selectedFolderId, selectedCatId, filterQuery]);

  const activeVideos = useMemo(() => {
    let result = videos;
    if (selectedFolderId !== null) {
      result = videos.filter(v => v.folderId === selectedFolderId);
    } else if (selectedCatId !== null) {
      result = videos.filter(v => v.folder?.mainCategoryId === selectedCatId);
    }
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      result = result.filter(v => v.title.toLowerCase().includes(q) || (v.tags && v.tags.some(t => t.toLowerCase().includes(q))));
    }
    return result;
  }, [videos, selectedFolderId, selectedCatId, filterQuery]);

  // Find active node name for title
  const activeNodeName = useMemo(() => {
    if (selectedFolderId !== null) {
      const findFolder = (list: CategoryFolder[]): CategoryFolder | null => {
        for (const f of list) {
          if (f.id === selectedFolderId) return f;
          if (f.children) {
            const res = findFolder(f.children);
            if (res) return res;
          }
        }
        return null;
      };
      const found = findFolder(folders);
      return found ? found.name : `תיקייה #${selectedFolderId}`;
    }
    if (selectedCatId !== null) {
      const cat = categories.find(c => c.id === selectedCatId);
      return cat ? cat.name : 'כל המערכות והתיקיות';
    }
    return 'כל המערכות והתיקיות';
  }, [selectedFolderId, selectedCatId, folders, categories]);

  if (showLoader) {
    return (
      <div className={styles.layoutContainer}>
        <Sidebar />
        <div className={styles.contentArea}>
          <PageLoader fullScreen message="טוען נתוני ניהול..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      <div className={styles.contentArea}>
        <Navbar breadcrumbs={[{ label: 'פאנל ניהול' }]} />

        <main className={styles.page}>
          {/* Main Navigation Tabs */}
          <div className={styles.tabs} role="tablist">
            <button
              className={activeTab === 'explorer' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('explorer')}
            >
              <LayoutGrid size={16} style={{ marginLeft: 6 }} />
              סייר ניהול ותיקיות (Visual Explorer)
            </button>

            {isAdmin && (
              <button
                className={activeTab === 'analytics' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 size={16} style={{ marginLeft: 6 }} />
                מדדים ואנליטיקה
              </button>
            )}

            {isAdmin && (
              <button
                className={activeTab === 'notifications' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={16} style={{ marginLeft: 6 }} />
                הודעות מערכת ({notifications.length})
              </button>
            )}
          </div>

          {/* ===== TAB 1: UNIFIED SPLIT-PANE EXPLORER ===== */}
          {activeTab === 'explorer' && (
            <div className={styles.explorerSplitView}>
              {/* RIGHT PANE: Interactive Directory Tree */}
              <aside className={styles.treePane}>
                <div className={styles.treePaneHeader}>
                  <FolderIcon size={18} color="#f59e0b" />
                  <h4>עץ קטגוריות ותיקיות</h4>
                  <button
                    className={styles.quickAddFolderBtn}
                    onClick={() => setFolderModalTarget('NEW')}
                    title="הוסף תיקייה חדשה"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className={styles.treePaneContent}>
                  {categories.map(cat => {
                    const isCatSelected = selectedCatId === cat.id && selectedFolderId === null;
                    const catFolders = folders.filter(f => f.mainCategoryId === cat.id && !f.parentId);

                    return (
                      <div key={cat.id} className={styles.treeCategoryGroup}>
                        <div
                          className={`${styles.treeCategoryRow} ${isCatSelected ? styles.treeRowSelected : ''}`}
                          onClick={() => {
                            setSelectedCatId(cat.id);
                            setSelectedFolderId(null);
                          }}
                        >
                          <FolderIcon size={16} color={cat.color || '#3b82f6'} />
                          <span className={styles.treeNodeLabel}>{cat.name}</span>
                          <button
                            className={styles.treeAddBtn}
                            onClick={e => {
                              e.stopPropagation();
                              setFolderModalTarget('NEW');
                            }}
                            title="הוסף תיקייה בקטגוריה זו"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {catFolders.length > 0 && (
                          <div className={styles.treeChildrenWrap}>
                            {catFolders.map(folder => (
                              <TreeFolderItem
                                key={folder.id}
                                folder={folder}
                                depth={0}
                                selectedFolderId={selectedFolderId}
                                onSelect={(fId) => {
                                  setSelectedFolderId(fId);
                                  setSelectedCatId(folder.mainCategoryId);
                                }}
                                onAddSubFolder={() => setFolderModalTarget('NEW')}
                                onEdit={f => setFolderModalTarget(f)}
                                onDelete={handleDeleteFolder}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>

              {/* LEFT PANE: Selected Node Content & Action Controls */}
              <section className={styles.contentPane}>
                <div className={styles.contentPaneHeader}>
                  <div className={styles.headerTitleGroup}>
                    <h2>{activeNodeName}</h2>
                    <span className={styles.itemsCountBadge}>
                      {activeSystems.length} מערכות | {activeVideos.length} סרטונים
                    </span>
                  </div>

                  <div className={styles.headerActionsGroup}>
                    <div className={styles.searchBox}>
                      <input
                        className={styles.searchInput}
                        placeholder="סינון בתיקייה..."
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                      />
                    </div>

                    <button
                      className={styles.addPrimaryBtn}
                      onClick={() => setSystemModalTarget('NEW')}
                    >
                      <Plus size={15} /> הוסף מערכת
                    </button>

                    <button
                      className={`${styles.addPrimaryBtn} ${styles.addVideoBtn}`}
                      onClick={() => setVideoModalTarget('NEW')}
                    >
                      <Plus size={15} /> העלה סרטון
                    </button>
                  </div>
                </div>

                {/* Items Grid */}
                <div className={styles.paneGridSection}>
                  {/* Systems */}
                  {activeSystems.length > 0 && (
                    <div className={styles.paneGroup}>
                      <h4 className={styles.groupTitle}>🌐 מערכות ואתרים ({activeSystems.length})</h4>
                      <div className={styles.paneItemsGrid}>
                        {activeSystems.map(sys => (
                          <div key={sys.id} className={styles.itemExplorerCard}>
                            <div className={styles.itemCardHeader}>
                              <div className={styles.itemIconBox}>
                                {sys.imageUrl ? (
                                  <img src={sys.imageUrl} alt={sys.name} className={sys.name} />
                                ) : (
                                  <Globe size={18} color="#3b82f6" />
                                )}
                              </div>
                              <div className={styles.itemCardActions}>
                                <button
                                  className={styles.iconBtn}
                                  onClick={() => setSystemModalTarget(sys)}
                                  title="ערוך"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  className={`${styles.iconBtn} ${styles.dangerBtn}`}
                                  onClick={() => handleDeleteSystem(sys.id)}
                                  title="מחק"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <h5 className={styles.itemCardTitle}>{sys.name}</h5>
                            {sys.description && <p className={styles.itemCardDesc}>{sys.description}</p>}

                            {sys.tags && sys.tags.length > 0 && (
                              <div className={styles.tagChipsInline}>
                                {sys.tags.map(t => <span key={t} className={styles.tagChipMini}>#{t}</span>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {activeVideos.length > 0 && (
                    <div className={styles.paneGroup}>
                      <h4 className={styles.groupTitle}>🎬 סרטוני הדרכה ({activeVideos.length})</h4>
                      <div className={styles.paneItemsGrid}>
                        {activeVideos.map(vid => (
                          <div key={vid.id} className={styles.itemExplorerCard}>
                            <div className={styles.itemCardHeader}>
                              <div className={styles.itemIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                                <Film size={18} color="#a855f7" />
                              </div>
                              <div className={styles.itemCardActions}>
                                <button
                                  className={styles.iconBtn}
                                  onClick={() => setVideoModalTarget(vid)}
                                  title="ערוך"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  className={`${styles.iconBtn} ${styles.dangerBtn}`}
                                  onClick={() => handleDeleteVideo(vid.id)}
                                  title="מחק"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <h5 className={styles.itemCardTitle}>{vid.title}</h5>
                            {vid.description && <p className={styles.itemCardDesc}>{vid.description}</p>}

                            {vid.tags && vid.tags.length > 0 && (
                              <div className={styles.tagChipsInline}>
                                {vid.tags.map(t => <span key={t} className={styles.tagChipMini}>#{t}</span>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSystems.length === 0 && activeVideos.length === 0 && (
                    <div className={styles.emptyPane}>
                      <FolderIcon size={44} color="var(--muted)" style={{ opacity: 0.4 }} />
                      <p>אין מערכות או סרטונים בתיקייה זו עדיין.</p>
                      <button className={styles.addPrimaryBtn} onClick={() => setSystemModalTarget('NEW')}>
                        <Plus size={14} /> הוסף פריט לתיקייה זו
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ===== TAB 2: ANALYTICS DASHBOARD ===== */}
          {activeTab === 'analytics' && isAdmin && (
            <AnalyticsDashboard />
          )}

          {/* ===== TAB 3: NOTIFICATIONS ===== */}
          {activeTab === 'notifications' && isAdmin && (
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <h3 className={styles.subTitle}>ניהול הודעות מערכת ועדכונים</h3>
                <button
                  className={styles.addBtn}
                  onClick={() => setShowNotificationModal(true)}
                >
                  <Plus size={16} /> הודעה חדשה
                </button>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableHeaderRow} style={{ gridTemplateColumns: '2fr 4fr 1.5fr 1fr' }}>
                  <span>כותרת ההודעה</span>
                  <span>תוכן ההודעה</span>
                  <span>תאריך יצירה</span>
                  <span style={{ textAlign: 'center' }}>פעולות</span>
                </div>

                {notifications.map(notif => (
                  <div key={notif.id} className={styles.tableDataRow} style={{ gridTemplateColumns: '2fr 4fr 1.5fr 1fr' }}>
                    <div className={styles.sysCellName}>
                      <Bell size={18} color="#3b82f6" />
                      <span className={styles.sysNameText}>{notif.title}</span>
                    </div>

                    <span className={styles.sysDescText}>{notif.message}</span>

                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(notif.createdAt).toLocaleDateString('he-IL')}
                    </span>

                    <div className={styles.actionsCell}>
                      <button
                        className={`${styles.iconBtn} ${styles.dangerBtn}`}
                        onClick={() => handleDeleteNotification(notif.id)}
                        title="מחק הודעה"
                      >
                        <Trash2 size={15} /> מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {systemModalTarget && (
        <SystemModal
          system={systemModalTarget === 'NEW' ? null : systemModalTarget}
          defaultFolderId={selectedFolderId}
          folders={folders}
          mainCategories={categories}
          onClose={() => setSystemModalTarget(null)}
          onSave={loadData}
        />
      )}

      {folderModalTarget && (
        <FolderModal
          folder={folderModalTarget === 'NEW' ? null : folderModalTarget}
          defaultParentId={selectedFolderId}
          defaultMainCategoryId={selectedCatId}
          folders={folders}
          mainCategories={categories}
          onClose={() => setFolderModalTarget(null)}
          onSave={loadData}
        />
      )}

      {videoModalTarget && (
        <VideoModalEdit
          video={videoModalTarget === 'NEW' ? null : videoModalTarget}
          defaultFolderId={selectedFolderId}
          folders={folders}
          mainCategories={categories}
          onClose={() => setVideoModalTarget(null)}
          onSave={loadData}
        />
      )}

      {showNotificationModal && (
        <NotificationModal
          onClose={() => setShowNotificationModal(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
}

// Sub-component: Recursive Tree Folder Item in Explorer Pane
function TreeFolderItem({
  folder,
  depth,
  selectedFolderId,
  onSelect,
  onAddSubFolder,
  onEdit,
  onDelete,
}: {
  folder: CategoryFolder;
  depth: number;
  selectedFolderId: number | null;
  onSelect: (id: number) => void;
  onAddSubFolder: () => void;
  onEdit: (f: CategoryFolder) => void;
  onDelete: (id: number) => void;
}) {
  const isSelected = selectedFolderId === folder.id;

  return (
    <div className={styles.treeFolderNode}>
      <div
        className={`${styles.treeFolderRow} ${isSelected ? styles.treeRowSelected : ''}`}
        style={{ paddingRight: 12 + depth * 14 }}
        onClick={() => onSelect(folder.id)}
      >
        <FolderIcon size={14} color="#f59e0b" />
        <span className={styles.treeNodeLabel}>{folder.name}</span>
        <button
          className={styles.treeAddBtn}
          onClick={e => {
            e.stopPropagation();
            onAddSubFolder();
          }}
          title="הוסף תת-תיקייה"
        >
          <Plus size={11} />
        </button>
        <button
          className={styles.treeAddBtn}
          onClick={e => {
            e.stopPropagation();
            onEdit(folder);
          }}
          title="ערוך תיקייה"
        >
          <Pencil size={11} />
        </button>
        <button
          className={`${styles.treeAddBtn} ${styles.dangerBtn}`}
          onClick={e => {
            e.stopPropagation();
            onDelete(folder.id);
          }}
          title="מחק תיקייה"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {folder.children && folder.children.length > 0 && (
        <div className={styles.treeSubFolderWrap}>
          {folder.children.map(child => (
            <TreeFolderItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onAddSubFolder={onAddSubFolder}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
