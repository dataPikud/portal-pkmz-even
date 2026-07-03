import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Clock } from 'lucide-react';
import { api } from '../lib/api';
import type { MainCategory, System } from '../types';
import styles from './HomePage.module.css';

function CategoryTile({ cat }: { cat: MainCategory }) {
  const navigate = useNavigate();
  return (
    <button
      className={styles.catTile}
      onClick={() => navigate(`/category/${cat.id}`)}
      aria-label={`עבור אל ${cat.name}`}
    >
      <span className={styles.catTileIcon}>{cat.name}</span>
      <h3 className={styles.catName}>{cat.name}</h3>
      {cat.description && <p className={styles.catDesc}>{cat.description}</p>}
    </button>
  );
}

function RecentCard({ system }: { system: System }) {
  function handleClick() {
    void api.visits.record(system.id);
    window.open(system.url, '_blank', 'noopener,noreferrer');
  }
  return (
    <button className={styles.recentCard} onClick={handleClick} aria-label={`פתח ${system.name}`}>
      <span className={styles.recentName}>{system.name}</span>
      {system.subCategory?.mainCategory && (
        <span className={styles.recentCat}>{system.subCategory.mainCategory.name}</span>
      )}
      <ExternalLink size={13} className={styles.recentIcon} aria-hidden="true" />
    </button>
  );
}

export function HomePage() {
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [recent, setRecent] = useState<System[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    void api.mainCategories.list()
      .then((data) => { setCategories(data); setLoadingCats(false); })
      .catch(() => setLoadingCats(false));

    void api.visits.recent().then(setRecent).catch(() => {});
  }, []);

  return (
    <main className={styles.page}>

      {/* Hero */}
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>פורטל פקמ"ז</p>
          <h1 className={styles.heroTitle}>נקודת הכניסה לכל המערכות ברשת</h1>
          <p className={styles.heroSub}>
            דף הבית של פקמ"ז מרכז כלים, שירותים ומידע, במקום אחד נגיש וברור.
          </p>
        </div>
        {/* <div className={styles.statusPanel} aria-label="סטטוס הפורטל">
          <span className={styles.statusDot} />
          הפורטל פעיל
        </div> */}
      </header>

      {/* גישה מהירה */}
      {recent.length > 0 && (
        <section className={styles.recentSection} aria-label="מערכות שנפתחו לאחרונה">
          <div className={styles.sectionHeader}>
            <Clock size={14} aria-hidden="true" />
            <h2 className={styles.sectionTitle}>גישה מהירה</h2>
          </div>
          <div className={styles.recentGrid}>
            {recent.map((sys) => (
              <RecentCard key={sys.id} system={sys} />
            ))}
          </div>
        </section>
      )}

      {/* קטגוריות */}
      <section className={styles.catsSection} aria-label="קטגוריות מערכות">
        <div>
          <h2 className={styles.sectionTitle} style={{ fontSize: 22, marginBottom: 4 }}>מערכות הארגון</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
            בחר קטגוריה לצפייה במערכות הרלוונטיות.
          </p>
        </div>

        {loadingCats ? (
          <div className={styles.loader} aria-label="טוען קטגוריות...">
            {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : (
          <div className={styles.catGrid}>
            {categories.map((cat) => (
              <CategoryTile key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
