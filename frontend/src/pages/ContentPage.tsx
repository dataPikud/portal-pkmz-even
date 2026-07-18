import { useEffect, useState, useCallback, useMemo } from 'react';
import { Play, Share2, Film, Star, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { VideoModal } from '../components/VideoModal';
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

export function videoUrl(fileName: string): string {
  return `/uploads/videos/${encodeURIComponent(fileName)}`;
}

export function thumbnailUrl(fileName: string): string {
  return `/uploads/thumbnails/${encodeURIComponent(fileName)}`;
}

// ===== Video Card Redesigned to match SystemCard =====
function VideoCard({
  video,
  onPlay,
  isFav,
  onToggleFav,
}: {
  video: Video;
  onPlay: (video: Video) => void;
  isFav: boolean;
  onToggleFav: (id: number) => void;
}) {
  const duration = formatDuration(video.duration);

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/content?v=${video.id}`;
    if (navigator.share) {
      void navigator.share({ title: video.title, url });
    } else {
      void navigator.clipboard.writeText(url).then(() => {
        alert('הקישור הועתק ללוח');
      });
    }
  }

  function handleToggleStar(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleFav(video.id);
  }

  return (
    <article
      className={`${styles.card} ${isFav ? styles.cardFav : ''}`}
      onClick={() => onPlay(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(video);
        }
      }}
      aria-label={`הפעל סרטון: ${video.title}`}
    >
      {/* Star button on top-right */}
      <button
        type="button"
        className={`${styles.starBtn} ${isFav ? styles.starFavActive : ''}`}
        onClick={handleToggleStar}
        title={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        aria-label={isFav ? `הסר את ${video.title} ממועדפים` : `הוסף את ${video.title} למועדפים`}
      >
        <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
      </button>

      {/* Share button on top-left */}
      <button
        type="button"
        className={styles.shareBtn}
        onClick={handleShare}
        title="שתף סרטון"
        aria-label="שתף סרטון"
      >
        <Share2 size={16} />
      </button>

      {/* Glass circular container with video thumbnail/icon & play overlay */}
      <div className={styles.imageContainer}>
        {video.thumbnailName ? (
          <img
            src={thumbnailUrl(video.thumbnailName)}
            alt={video.title}
            className={styles.systemImg}
            loading="lazy"
          />
        ) : (
          <Film size={26} color="#8b5cf6" aria-hidden="true" />
        )}
        
        {/* Play Overlay indicator */}
        <div className={styles.playOverlay} aria-hidden="true">
          <Play size={18} fill="currentColor" />
        </div>
      </div>

      {/* Video Details */}
      <h3 className={styles.cardName}>{video.title}</h3>
      {video.description && (
        <p className={styles.cardDesc}>{video.description}</p>
      )}

      {/* Duration Badge */}
      {duration && (
        <span className={styles.durationBadge}>
          <Clock size={11} />
          {duration}
        </span>
      )}
    </article>
  );
}

// ===== Main ContentPage =====
export function ContentPage() {
  const user = useAuthStore(s => s.user);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Favorites state for videos
  const [videoFavs, setVideoFavs] = useState<number[]>([]);
  const favStorageKey = `portal-video-favorites-${user?.employeeId || 'guest'}`;

  // Load video favorites
  useEffect(() => {
    try {
      const stored = localStorage.getItem(favStorageKey);
      if (stored) setVideoFavs(JSON.parse(stored) as number[]);
    } catch {
      // ignore
    }
  }, [favStorageKey]);

  function handleToggleFav(id: number) {
    const exists = videoFavs.includes(id);
    const updated = exists ? videoFavs.filter(fid => fid !== id) : [...videoFavs, id];
    setVideoFavs(updated);
    localStorage.setItem(favStorageKey, JSON.stringify(updated));
  }

  // Fetch videos list
  useEffect(() => {
    void api.videos.list()
      .then(list => {
        setVideos(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Handle deep link /content?v=<id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('v');
    if (id && videos.length > 0) {
      const found = videos.find(v => v.id === Number(id));
      if (found) setActiveVideo(found);
    }
  }, [videos]);

  const handleClose = useCallback(() => {
    setActiveVideo(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('v');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Filtered list of videos based on search
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(
      v =>
        v.title.toLowerCase().includes(q) ||
        (v.description ?? '').toLowerCase().includes(q)
    );
  }, [videos, searchQuery]);

  return (
    <div className={styles.layoutContainer}>
      {/* Right Sidebar */}
      <Sidebar />

      <div className={styles.contentArea}>
        {/* Navbar with breadcrumbs and live search */}
        <Navbar
          breadcrumbs={[{ label: 'חומרי הטמעה' }]}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="חיפוש סרטון הדרכה..."
        />

        {/* Main Content Grid */}
        <main className={styles.mainContent}>
          {loading ? (
            <div className={styles.loaderWrapper}>
              <span style={{ color: 'var(--muted)' }}>טוען סרטונים...</span>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className={styles.empty}>
              <Film size={36} className={styles.emptyIcon} />
              <p>לא נמצאו סרטוני הדרכה מתאימים</p>
            </div>
          ) : (
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
          )}
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

