import styles from './PageLoader.module.css';
import pakmazLogo from '../assets/PakmazLogo.svg.png';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({ message = 'טוען נתונים...', fullScreen = false }: PageLoaderProps) {
  return (
    <div className={`${styles.loaderContainer} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.logoWrapper}>
        {/* Creative ambient pulse rings */}
        <div className={styles.pulseRing} />
        <div className={styles.pulseRingOuter} />

        {/* Static Logo with breathing pulse glow (NO image rotation) */}
        <img src={pakmazLogo} alt="לוגו פקמז" className={styles.logoImage} />

        {/* Orbiting accent light dot */}
        <div className={styles.orbitContainer}>
          <div className={styles.orbitDot} />
        </div>
      </div>

      <div className={styles.textWrapper}>
        <p className={styles.message}>{message}</p>
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} />
        </div>
      </div>
    </div>
  );
}
