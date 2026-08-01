import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Share2, Film, Star, Clock, Folder as FolderIcon, ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useAuthStore } from '../store/useAuthStore';
import { useEditModeStore } from '../store/useEditModeStore';
import { useSmartLoader } from '../hooks/useSmartLoader';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { VideoModal } from '../components/VideoModal';
import { PageLoader } from '../components/PageLoader';
import { VideoModalEdit } from '../components/admin/VideoModalEdit';
import { FolderModal } from '../components/admin/FolderModal';
import type { Video, CategoryFolder, MainCategory } from '../types';
import styles from './ContentPage.module.css';

/** Format seconds → mm:ss or hh:mm:ss */
function formatDuration(secs: number | null | undefined): string {
  if (!secs || secs <= 0) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Construct direct URL to video file */
export function videoUrl(filename: string): string {
  return `/uploads/videos/${encodeURIComponent(filename)}`;
}

/** Construct direct URL to thumbnail image */
export function thumbnailUrl(filename?: string | null): string | null {
  if (!filename) return null;
  return `/uploads/thumbnails/${encodeURIComponent(filename)}`;
}

// ===== Subcomponent: Video Card =====
interface VideoCardProps {
  video: Video;
  onPlay: (v: Video) => void;
  isFav: boolean;
  onToggleFav: (id: number) => void;
  isEditMode?: boolean;
  onEdit?: (v: Video) => void;
  onDelete?: (id: number) => void;
}

function VideoCard({ video, onPlay, isFav, onToggleFav, isEditMode, onEdit, onDelete }: VideoCardProps) {
  const [copied, setCopied] = useState(false);
  const thumb = thumbnailUrl(video.thumbnailName);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/content?video=${video.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [video.id]);

  return (
    <div
      className={styles.card}
      onClick={() => onPlay(video)}
      tabIndex={0}
      role="button"
      onKeyDown={e => e.key === 'Enter' && onPlay(video)}
    >
      {/* Admin Quick Action Overlay when Edit Mode is ON */}
      {isEditMode && (
        <div className={styles.adminCardOverlay}>
          {onEdit && (
            <button
              className={styles.adminActionBtn}
              onClick={e => { e.stopPropagation(); onEdit(video); }}
              title="ערוך סרטון"
            >
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              className={`${styles.adminActionBtn} ${styles.adminDeleteBtn}`}
              onClick={e => { e.stopPropagation(); onDelete(video.id); }}
              title="מחק סרטון"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      <div className={styles.thumbnailWrapper}>
        {thumb ? (
          <img src={thumb} alt={video.title} className={styles.thumbnail} />
        ) : (
          <div className={styles.placeholderThumb}>
            <Film size={36} color="rgba(255,255,255,0.2)" />
          </div>
        )}

        <div className={styles.playOverlay}>
          <div className={styles.playButton}>
            <Play size={22} fill="#fff" color="#fff" />
          </div>
        </div>

        {video.duration ? (
          <div className={styles.durationBadge}>
            <Clock size={11} />
            {formatDuration(video.duration)}
          </div>
        ) : null}

        <button
          className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
          onClick={e => {
            e.stopPropagation();
            onToggleFav(video.id);
          }}
          title={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          <Star size={14} fill={isFav ? '#f59e0b' : 'none'} color={isFav ? '#f59e0b' : '#fff'} />
        </button>

        <button
          className={styles.shareBtn}
          onClick={handleShare}
          title="העתק קישור לסרטון"
        >
          <Share2 size={13} color="#fff" />
        </button>

        {copied && <div className={styles.copiedToast}>הקישור הועתק!</div>}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{video.title}</h3>
        {video.description && (
          <p className={styles.cardDesc}>{video.description}</p>
        )}
        {video.tags && video.tags.length > 0 && (
          <div className={styles.tagChips}>
            {video.tags.map(t => (
              <span key={t} className={styles.tagPill}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Main Content Page Component =====
export function ContentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFolderId = searchParams.get('folder') ? Number(searchParams.get('folder')) : null;

  const [videos, setVideos] = useState<Video[]>([]);
  const [folders, setFolders] = useState<CategoryFolder[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id?: number; name: string }>>([]);

  const [allFoldersTree, setAllFoldersTree] = useState<CategoryFolder[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);

  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // In-Context Edit Mode
  const user = useAuthStore(s => s.user);
  const isEditMode = useEditModeStore(s => s.isEditMode);
  const canManageContent = Boolean(user?.isAdmin || user?.isContentAdmin);

  const [videoModalTarget, setVideoModalTarget] = useState<Video | null | 'NEW'>(null);
  const [folderModalTarget, setFolderModalTarget] = useState<CategoryFolder | null | 'NEW'>(null);

  const { showLoader, isContentReady } = useSmartLoader(loading, {
    delayMs: 2000,
    minVisibleMs: 5000,
  });

  const videoFavs = useFavoritesStore(s => s.videoFavorites);
  const toggleVideoFav = useFavoritesStore(s => s.toggleVideoFavorite);

  const loadData = () => {
    setLoading(true);
    const mainContentCategoryId = 4; // Main Category 4 = חומרי הטמעה

    Promise.all([
      api.mainCategories.list(),
      api.folders.tree(),
    ]).then(([cats, tree]) => {
      setMainCategories(cats);
      setAllFoldersTree(tree);
    });

    if (activeFolderId) {
      Promise.all([
        api.videos.list(),
        api.folders.get(activeFolderId),
      ])
        .then(([allVids, foldRes]) => {
          setVideos(allVids.filter(v => v.folderId === activeFolderId));
          setFolders(foldRes.children ?? []);
          setBreadcrumbs(foldRes.breadcrumbs ?? [{ name: foldRes.name }]);
        })
        .catch(err => console.error('Failed to load folder content:', err))
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        api.videos.list(),
        api.folders.tree(mainContentCategoryId),
      ])
        .then(([allVids, treeRes]) => {
          setVideos(allVids.filter(v => !v.folderId || treeRes.some(f => f.id === v.folderId)));
          setFolders(treeRes);
          setBreadcrumbs([]);
        })
        .catch(err => console.error('Failed to load videos & folders:', err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFolderId]);

  async function handleDeleteVideo(vId: number) {
    if (!confirm('האם למחוק את סרטון ההדרכה?')) return;
    try {
      await api.videos.delete(vId);
      loadData();
    } catch {
      alert('מחיקת הסרטון נכשלה');
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

  // Auto-open video from URL query param `?video=ID`
  useEffect(() => {
    const videoId = searchParams.get('video');
    if (videoId && videos.length > 0) {
      const found = videos.find(v => String(v.id) === videoId);
      if (found) setActiveVideo(found);
    }
  }, [searchParams, videos]);

  const handleClose = useCallback(() => {
    setActiveVideo(null);
  }, []);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const q = searchQuery.toLowerCase().trim();
    return videos.filter(
      v => v.title.toLowerCase().includes(q) || (v.description && v.description.toLowerCase().includes(q))
    );
  }, [videos, searchQuery]);

  const navBreadcrumbs = useMemo(() => {
    const base = [{ label: 'חומרי הטמעה', onClick: () => setSearchParams({}) }];
    if (breadcrumbs.length > 0) {
      breadcrumbs.forEach(b => {
        base.push({
          label: b.name,
          onClick: () => (b.id ? setSearchParams({ folder: String(b.id) }) : setSearchParams({})),
        });
      });
    }
    return base;
  }, [breadcrumbs, setSearchParams]);

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />

      <div className={styles.contentArea}>
        <Navbar
          breadcrumbs={navBreadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="חיפוש סרטון או תג..."
        />

        <main className={styles.mainContent}>
          {/* Action Bar when Edit Mode is ON */}
          {isEditMode && canManageContent && (
            <div className={styles.inContextActionBar}>
              <div className={styles.actionBarTitle}>
                <span>✏️ מצב עריכה פעיל - חומרי הטמעה</span>
              </div>
              <div className={styles.actionBarBtns}>
                <button
                  className={styles.addContextBtn}
                  onClick={() => setVideoModalTarget('NEW')}
                >
                  <Plus size={14} /> העלה סרטון הדרכה
                </button>
                <button
                  className={`${styles.addContextBtn} ${styles.addFolderBtn}`}
                  onClick={() => setFolderModalTarget('NEW')}
                >
                  <Plus size={14} /> הוסף תיקיית סרטונים
                </button>
              </div>
            </div>
          )}

          {showLoader ? (
            <div className={styles.loaderWrapper}>
              <PageLoader message="טוען חומרי הטמעה..." />
            </div>
          ) : isContentReady ? (
            <div className={styles.contentSections}>
              {/* Folders Section (if any exist) */}
              {folders.length > 0 && (
                <section className={styles.sectionWrap}>
                  <div className={styles.sectionHeader}>
                    <FolderIcon size={20} color="#f59e0b" />
                    <h3 className={styles.sectionTitle}>תיקיות חומרי הטמעה</h3>
                  </div>
                  <div className={styles.foldersGrid}>
                    {folders.map(f => (
                      <div
                        key={f.id}
                        className={styles.folderCard}
                        onClick={() => setSearchParams({ folder: String(f.id) })}
                      >
                        {isEditMode && canManageContent && (
                          <div className={styles.adminCardOverlay}>
                            <button
                              className={styles.adminActionBtn}
                              onClick={e => { e.stopPropagation(); setFolderModalTarget(f); }}
                              title="ערוך תיקייה"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className={`${styles.adminActionBtn} ${styles.adminDeleteBtn}`}
                              onClick={e => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                              title="מחק תיקייה"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}

                        <div className={styles.folderIconBox}>
                          {f.imageUrl ? (
                            <img src={f.imageUrl} alt={f.name} className={styles.folderImg} />
                          ) : (
                            <FolderIcon size={24} color="#f59e0b" />
                          )}
                        </div>
                        <div className={styles.folderInfo}>
                          <span className={styles.folderName}>{f.name}</span>
                          {f.description && <span className={styles.folderDesc}>{f.description}</span>}
                        </div>
                        <ChevronLeft size={16} className={styles.folderArrow} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Videos Grid */}
              <section className={styles.sectionWrap}>
                {folders.length > 0 && (
                  <div className={styles.sectionHeader}>
                    <Film size={20} color="#a855f7" />
                    <h3 className={styles.sectionTitle}>סרטוני הדרכה</h3>
                  </div>
                )}

                {filteredVideos.length === 0 ? (
                  <div className={styles.empty}>
                    <Film size={36} className={styles.emptyIcon} />
                    <p>אין סרטוני הדרכה בתיקייה זו</p>
                  </div>
                ) : (
                  <div className={styles.cardsGrid}>
                    {filteredVideos.map(video => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onPlay={v => {
                          void api.visits.record(undefined, v.id);
                          setActiveVideo(v);
                        }}
                        isFav={videoFavs.includes(video.id)}
                        onToggleFav={id => toggleVideoFav(id)}
                        isEditMode={isEditMode && canManageContent}
                        onEdit={v => setVideoModalTarget(v)}
                        onDelete={handleDeleteVideo}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </main>
      </div>

      {/* Video Modal popup player */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={handleClose}
        />
      )}

      {/* In-Context Edit Modals */}
      {videoModalTarget && (
        <VideoModalEdit
          video={videoModalTarget === 'NEW' ? null : videoModalTarget}
          defaultFolderId={activeFolderId}
          folders={allFoldersTree}
          mainCategories={mainCategories}
          onClose={() => setVideoModalTarget(null)}
          onSave={loadData}
        />
      )}

      {folderModalTarget && (
        <FolderModal
          folder={folderModalTarget === 'NEW' ? null : folderModalTarget}
          defaultParentId={activeFolderId}
          defaultMainCategoryId={4}
          folders={allFoldersTree}
          mainCategories={mainCategories}
          onClose={() => setFolderModalTarget(null)}
          onSave={loadData}
        />
      )}
    </div>
  );
}
