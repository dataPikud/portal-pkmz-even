import { useEffect, useState, useCallback, useMemo } from 'react';
import { Play, Share2, Film, Star, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useSmartLoader } from '../hooks/useSmartLoader';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { VideoModal } from '../components/VideoModal';
import { PageLoader } from '../components/PageLoader';
import type { Video } from '../types';
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
}

function VideoCard({ video, onPlay, isFav, onToggleFav }: VideoCardProps) {
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
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(video);
        }
      }}
    >
      {/* Star button top-right */}
      <button
        type="button"
        className={`${styles.starBtn} ${isFav ? styles.starFavActive : ''}`}
        onClick={e => {
          e.stopPropagation();
          onToggleFav(video.id);
        }}
        title={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
      >
        <Star size={16} fill={isFav ? '#f59e0b' : 'none'} color={isFav ? '#f59e0b' : 'currentColor'} />
      </button>

      {/* Share button top-left */}
      <button
        type="button"
        className={styles.shareBtn}
        onClick={handleShare}
        title={copied ? 'הקישור הועתק!' : 'שתף קישור'}
      >
        <Share2 size={16} color={copied ? '#10b981' : 'currentColor'} />
      </button>

      {/* Thumbnail or icon fallback with hover play overlay */}
      <div className={styles.imageContainer}>
        {thumb ? (
          <img src={thumb} alt={video.title} className={styles.systemImg} />
        ) : (
          <Film size={28} color="#8b5cf6" />
        )}
        <div className={styles.playOverlay}>
          <Play size={20} fill="currentColor" />
        </div>
      </div>

      <h3 className={styles.cardName}>{video.title}</h3>

      {video.description && (
        <p className={styles.cardDesc}>{video.description}</p>
      )}

      {video.duration ? (
        <div className={styles.durationBadge}>
          <Clock size={12} />
          <span>{formatDuration(video.duration)}</span>
        </div>
      ) : null}
    </div>
  );
}

// ===== Main ContentPage =====
export function ContentPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { showLoader, isContentReady } = useSmartLoader(loading, { delayMs: 2000, minVisibleMs: 5000 });
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Favorites state for videos
  const videoFavs = useFavoritesStore(s => s.videoFavorites);
  const toggleVideoFav = useFavoritesStore(s => s.toggleVideoFavorite);

  function handleToggleFav(id: number) {
    toggleVideoFav(id);
  }

  // Fetch videos list
  useEffect(() => {
    void api.videos.list()
      .then(res => setVideos(res))
      .catch(err => console.error('Failed to fetch videos:', err))
      .finally(() => setLoading(false));
  }, []);

  // Auto-open video from URL query param `?video=ID`
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('video');
    if (videoId && videos.length > 0) {
      const found = videos.find(v => String(v.id) === videoId);
      if (found) setActiveVideo(found);
    }
  }, [videos]);

  const handleClose = useCallback(() => {
    setActiveVideo(null);
  }, []);

  // Filter videos based on search query
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const q = searchQuery.toLowerCase().trim();
    return videos.filter(
      v => v.title.toLowerCase().includes(q) || (v.description && v.description.toLowerCase().includes(q))
    );
  }, [videos, searchQuery]);

  return (
    <div className={styles.layoutContainer}>
      {/* Right Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={styles.contentArea}>
        <Navbar
          breadcrumbs={[{ label: 'חומרי הטמעה' }]}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="חיפוש סרטון הדרכה..."
        />

        {/* Main Content Grid */}
        <main className={styles.mainContent}>
          {showLoader ? (
            <div className={styles.loaderWrapper}>
              <PageLoader message="טוען סרטוני הדרכה..." />
            </div>
          ) : isContentReady && filteredVideos.length === 0 ? (
            <div className={styles.empty}>
              <Film size={36} className={styles.emptyIcon} />
              <p>לא נמצאו סרטוני הדרכה מתאימים</p>
            </div>
          ) : isContentReady ? (
            <div className={styles.cardsGrid}>
              {filteredVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={v => setActiveVideo(v)}
                  isFav={videoFavs.includes(video.id)}
                  onToggleFav={handleToggleFav}
                />
              ))}
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
    </div>
  );
}
