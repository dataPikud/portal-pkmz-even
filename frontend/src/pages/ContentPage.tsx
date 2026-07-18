import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Share2, Clock, Film } from 'lucide-react';
import { api } from '../lib/api';
import type { Video } from '../types';
import { VideoModal } from '../components/VideoModal';
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

/** Build the URL for a video or thumbnail served from the backend */
export function videoUrl(fileName: string): string {
  return `/uploads/videos/${encodeURIComponent(fileName)}`;
}

export function thumbnailUrl(fileName: string): string {
  return `/uploads/thumbnails/${encodeURIComponent(fileName)}`;
}

// ===== Video Card =====
function VideoCard({
  video,
  onPlay,
}: {
  video: Video;
  onPlay: (video: Video) => void;
}) {
  const duration = formatDuration(video.duration);

  function handleShare() {
    const url = `${window.location.origin}/content?v=${video.id}`;
    if (navigator.share) {
      void navigator.share({ title: video.title, url });
    } else {
      void navigator.clipboard.writeText(url).then(() => {
        alert('הקישור הועתק ללוח');
      });
    }
  }

  return (
    <article className={styles.card} aria-label={video.title}>
      {/* Thumbnail / placeholder */}
      <div className={styles.thumb} onClick={() => onPlay(video)}>
        {video.thumbnailName ? (
          <img
            src={thumbnailUrl(video.thumbnailName)}
            alt={video.title}
            className={styles.thumbImg}
            loading="lazy"
          />
        ) : (
          <div className={styles.thumbPlaceholder}>
            <Film size={36} />
          </div>
        )}

        {/* Overlay play button */}
        <div className={styles.playOverlay} aria-hidden="true">
          <div className={styles.playCircle}>
            <Play size={22} fill="currentColor" />
          </div>
        </div>

        {/* Duration badge */}
        {duration && (
          <span className={styles.durationBadge}>
            <Clock size={11} />
            {duration}
          </span>
        )}
      </div>

      {/* Info */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle} onClick={() => onPlay(video)}>
          {video.title}
        </h3>
        {video.description && (
          <p className={styles.cardDesc}>{video.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.cardActions}>
        <button
          className={styles.playBtn}
          onClick={() => onPlay(video)}
          aria-label={`הפעל: ${video.title}`}
        >
          <Play size={14} fill="currentColor" />
          הפעל
        </button>
        <button
          className={styles.shareBtn}
          onClick={handleShare}
          aria-label={`שתף: ${video.title}`}
        >
          <Share2 size={14} />
        </button>
      </div>
    </article>
  );
}

// ===== Main ContentPage =====
export function ContentPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    void api.videos.list()
      .then(list => { setVideos(list); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Support deep-link: /content?v=<id>
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
    // Clean up URL param without navigation
    const url = new URL(window.location.href);
    url.searchParams.delete('v');
    window.history.replaceState({}, '', url.toString());
  }, []);

  return (
    <main className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="חזרה">
          <ArrowRight size={16} />
          חזרה לפורטל
        </button>
        <div className={styles.titleRow}>
          <Film size={28} className={styles.titleIcon} />
          <h1 className={styles.title}>חומרי הטמעה</h1>
        </div>
        <p className={styles.subtitle}>סרטוני הדרכה וחומרי לימוד</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>
          <span>טוען...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className={styles.empty}>
          <Film size={48} className={styles.emptyIcon} />
          <p>אין סרטונים עדיין</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {videos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={v => setActiveVideo(v)}
            />
          ))}
        </div>
      )}

      {/* Video modal */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={handleClose}
        />
      )}
    </main>
  );
}
