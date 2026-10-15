import { useEffect, useState } from 'react';
import { Tag as TagIcon, X, Globe, Film, Folder as FolderIcon, ExternalLink, Play, Star } from 'lucide-react';
import { api } from '../lib/api';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { VideoModal } from './VideoModal';
import type { SearchResult, Video } from '../types';
import styles from './TagSearchModal.module.css';

interface TagSearchModalProps {
  tag: string;
  onClose: () => void;
  onSelectFolder?: (folderId: number) => void;
}

export function TagSearchModal({ tag, onClose, onSelectFolder }: TagSearchModalProps) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const favorites = useFavoritesStore(s => s.favorites);
  const toggleFavorite = useFavoritesStore(s => s.toggleFavorite);
  const videoFavs = useFavoritesStore(s => s.videoFavorites);
  const toggleVideoFav = useFavoritesStore(s => s.toggleVideoFavorite);

  useEffect(() => {
    setLoading(true);
    api.search.query(undefined, tag)
      .then(res => setResults(res))
      .catch(err => console.error('Tag search failed:', err))
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <TagIcon size={20} color="#60a5fa" />
            <h2 className={styles.title}>תוצאות חיפוש עבור התגית: #{tag}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="סגור">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.loaderWrap}>
              <div className={styles.spinner} />
              <p>מחפש אייטמים מתוייגים...</p>
            </div>
          ) : !results || results.total === 0 ? (
            <div className={styles.emptyWrap}>
              <TagIcon size={40} color="var(--muted)" />
              <p>לא נמצאו תוצאות עבור התגית #{tag}</p>
            </div>
          ) : (
            <div className={styles.sectionsGrid}>
              {/* Systems Section */}
              {results.systems.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Globe size={16} color="#3b82f6" />
                    <h3>מערכות ואתרים ({results.systems.length})</h3>
                  </div>
                  <div className={styles.cardsGrid}>
                    {results.systems.map(sys => {
                      const isFav = favorites.includes(sys.id);
                      return (
                        <div key={sys.id} className={styles.itemCard}>
                          <button
                            className={`${styles.starBtn} ${isFav ? styles.starActive : ''}`}
                            onClick={e => {
                              e.stopPropagation();
                              toggleFavorite(sys.id);
                            }}
                          >
                            <Star size={14} fill={isFav ? '#f59e0b' : 'none'} color={isFav ? '#f59e0b' : 'currentColor'} />
                          </button>
                          <a href={sys.url} target="_blank" rel="noopener noreferrer" className={styles.itemLink}>
                            <div className={styles.iconWrap}>
                              {sys.imageUrl ? (
                                <img src={sys.imageUrl} alt={sys.name} className={styles.thumbImg} />
                              ) : (
                                <Globe size={20} color="#3b82f6" />
                              )}
                            </div>
                            <div className={styles.itemInfo}>
                              <h4 className={styles.itemName}>{sys.name}</h4>
                              {sys.description && <p className={styles.itemDesc}>{sys.description}</p>}
                            </div>
                            <ExternalLink size={14} className={styles.extIcon} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {results.videos.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Film size={16} color="#a855f7" />
                    <h3>סרטוני הדרכה ({results.videos.length})</h3>
                  </div>
                  <div className={styles.cardsGrid}>
                    {results.videos.map(vid => {
                      const isFav = videoFavs.includes(vid.id);
                      return (
                        <div
                          key={vid.id}
                          className={styles.itemCard}
                          onClick={() => setActiveVideo(vid)}
                        >
                          <button
                            className={`${styles.starBtn} ${isFav ? styles.starActive : ''}`}
                            onClick={e => {
                              e.stopPropagation();
                              toggleVideoFav(vid.id);
                            }}
                          >
                            <Star size={14} fill={isFav ? '#f59e0b' : 'none'} color={isFav ? '#f59e0b' : 'currentColor'} />
                          </button>
                          <div className={styles.itemContentWrap}>
                            <div className={styles.videoIconWrap}>
                              <Film size={20} color="#a855f7" />
                              <div className={styles.playOverlay}>
                                <Play size={12} fill="currentColor" />
                              </div>
                            </div>
                            <div className={styles.itemInfo}>
                              <h4 className={styles.itemName}>{vid.title}</h4>
                              {vid.description && <p className={styles.itemDesc}>{vid.description}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Folders Section */}
              {results.folders.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <FolderIcon size={16} color="#f59e0b" />
                    <h3>תיקיות קשורות ({results.folders.length})</h3>
                  </div>
                  <div className={styles.cardsGrid}>
                    {results.folders.map(folder => (
                      <div
                        key={folder.id}
                        className={styles.folderCard}
                        onClick={() => {
                          if (onSelectFolder) onSelectFolder(folder.id);
                          onClose();
                        }}
                      >
                        <FolderIcon size={22} color="#f59e0b" />
                        <div className={styles.itemInfo}>
                          <h4 className={styles.itemName}>{folder.name}</h4>
                          {folder.description && <p className={styles.itemDesc}>{folder.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}
