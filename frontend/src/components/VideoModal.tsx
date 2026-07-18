import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, RotateCcw, RotateCw, Share2,
} from 'lucide-react';
import type { Video } from '../types';
import { videoUrl } from '../pages/ContentPage';
import styles from './VideoModal.module.css';

interface Props {
  video: Video;
  onClose: () => void;
}

/** Format seconds → mm:ss or hh:mm:ss */
function fmt(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SKIP = 30;

export function VideoModal({ video, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [buffered, setBuffered] = useState(0);

  // ── Close on Escape ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isFullscreen) document.exitFullscreen().catch(() => undefined);
        else onClose();
      }
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') skip(SKIP);
      if (e.key === 'ArrowLeft') skip(-SKIP);
      if (e.key === 'm') toggleMute();
      if (e.key === 'f') toggleFullscreen();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    function onFSChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // ── Body scroll lock ─────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Auto-hide controls ───────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (playing) {
      hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
  }, [playing, resetHideTimer]);

  // ── Playback helpers ─────────────────────────────────────────────────────
  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { void v.play(); } else { v.pause(); }
  }

  function skip(secs: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + secs));
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  function changeSpeed(s: number) {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    const v = videoRef.current;
    if (v) { v.volume = val; v.muted = val === 0; }
    setVolume(val);
    setMuted(val === 0);
  }

  // ── Progress bar click / drag ─────────────────────────────────────────────
  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    // RTL: right edge = 0, left edge = duration
    const ratio = 1 - (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  }

  // ── Video events ──────────────────────────────────────────────────────────
  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
  }

  function onLoadedMetadata() {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  }

  function onPlay() { setPlaying(true); }
  function onPause() { setPlaying(false); setControlsVisible(true); }

  // ── Share ─────────────────────────────────────────────────────────────────
  function handleShare() {
    const url = `${window.location.origin}/content?v=${video.id}`;
    if (navigator.share) {
      void navigator.share({ title: video.title, url });
    } else {
      void navigator.clipboard.writeText(url).then(() => alert('הקישור הועתק ללוח'));
    }
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        ref={containerRef}
        className={styles.container}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => playing && setControlsVisible(false)}
      >
        {/* Close button (always visible) */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="סגור">
          <X size={20} />
        </button>

        {/* Title bar */}
        <div className={`${styles.titleBar} ${controlsVisible ? styles.visible : ''}`}>
          <span className={styles.videoTitle}>{video.title}</span>
          <button className={styles.iconBtn} onClick={handleShare} aria-label="שתף">
            <Share2 size={18} />
          </button>
        </div>

        {/* Video element */}
        <video
          ref={videoRef}
          className={styles.video}
          src={videoUrl(video.fileName)}
          onClick={togglePlay}
          onPlay={onPlay}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          playsInline
          preload="metadata"
        />

        {/* Big play/pause overlay click */}
        <div className={styles.videoClickArea} onClick={togglePlay} aria-hidden="true" />

        {/* Controls bar */}
        <div className={`${styles.controls} ${controlsVisible ? styles.visible : ''}`}>

          {/* Progress bar */}
          <div
            ref={progressRef}
            className={styles.progressBar}
            onClick={seekTo}
            role="slider"
            aria-label="התקדמות סרטון"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPct)}
          >
            <div className={styles.progressBg} />
            <div className={styles.progressBuffered} style={{ width: `${bufferedPct}%` }} />
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            <div className={styles.progressThumb} style={{ left: `${progressPct}%` }} />
          </div>

          {/* Bottom row */}
          <div className={styles.controlsRow}>
            {/* Left side – playback controls */}
            <div className={styles.controlsLeft}>
              {/* Play/Pause */}
              <button className={styles.iconBtn} onClick={togglePlay} aria-label={playing ? 'השהה' : 'הפעל'}>
                {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>

              {/* Skip back 30s */}
              <button className={styles.skipBtn} onClick={() => skip(-SKIP)} aria-label="אחורה 30 שניות">
                <RotateCcw size={17} />
                <span className={styles.skipLabel}>30</span>
              </button>

              {/* Skip forward 30s */}
              <button className={styles.skipBtn} onClick={() => skip(SKIP)} aria-label="קדימה 30 שניות">
                <RotateCw size={17} />
                <span className={styles.skipLabel}>30</span>
              </button>

              {/* Volume */}
              <div className={styles.volumeWrap}>
                <button className={styles.iconBtn} onClick={toggleMute} aria-label={muted ? 'בטל השתקה' : 'השתק'}>
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  className={styles.volumeSlider}
                  min={0} max={1} step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="עוצמת שמע"
                />
              </div>

              {/* Time */}
              <span className={styles.timeDisplay}>
                {fmt(currentTime)} / {fmt(duration)}
              </span>
            </div>

            {/* Right side – speed + fullscreen */}
            <div className={styles.controlsRight}>
              {/* Speed */}
              <div className={styles.speedWrap}>
                <button
                  className={styles.speedBtn}
                  onClick={() => setShowSpeedMenu(v => !v)}
                  aria-label="מהירות נגן"
                  aria-expanded={showSpeedMenu}
                >
                  {speed === 1 ? '1×' : `${speed}×`}
                </button>
                {showSpeedMenu && (
                  <div className={styles.speedMenu} role="menu">
                    {SPEEDS.map(s => (
                      <button
                        key={s}
                        role="menuitem"
                        className={`${styles.speedOption} ${s === speed ? styles.speedActive : ''}`}
                        onClick={() => changeSpeed(s)}
                      >
                        {s === 1 ? 'רגיל' : `${s}×`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button className={styles.iconBtn} onClick={toggleFullscreen} aria-label={isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}>
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
