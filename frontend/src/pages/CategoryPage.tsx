import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import type { MainCategory } from '../types';
import styles from './CategoryPage.module.css';

function SystemCard({ system }: {
  system: { id: number; name: string; description: string | null; url: string }
}) {
  function handleClick() {
    void api.visits.record(system.id);
    window.open(system.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <article className={styles.card}>
      <span className={styles.cardName}>{system.name}</span>
      {system.description && (
        <p className={styles.cardDesc}>{system.description}</p>
      )}
      <button
        className={styles.cardBtn}
        onClick={handleClick}
        aria-label={`פתח את ${system.name} בכרטיסייה חדשה`}
      >
        <ExternalLink size={13} aria-hidden="true" />
        פתח
      </button>
    </article>
  );
}

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<MainCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void api.mainCategories.get(Number(id))
      .then((data) => { setCategory(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.skeletonPage} aria-label="טוען..." />
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className={styles.page}>
        <p className={styles.errorMsg}>שגיאה בטעינת הקטגוריה</p>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          חזרה לדף הבית
        </button>
      </main>
    );
  }

  const subCategories = category.subCategories ?? [];
  const totalSystems = subCategories.reduce((acc, sub) => acc + (sub.systems?.length ?? 0), 0);

  return (
    <main className={styles.page}>

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="חזרה">
          <ArrowRight size={14} aria-hidden="true" />
          חזרה
        </button>
        <h1 className={styles.title}>{category.name}</h1>
        {category.description && <p className={styles.subtitle}>{category.description}</p>}
        <span className={styles.badge}>{totalSystems} מערכות</span>
      </div>

      {subCategories.length === 0 ? (
        <p className={styles.empty}>אין מערכות בקטגוריה זו</p>
      ) : (
        subCategories.map((sub) => (
          <section key={sub.id} className={styles.subSection}>
            <h2 className={styles.subTitle}>{sub.name}</h2>
            {!sub.systems || sub.systems.length === 0 ? (
              <p className={styles.empty}>אין מערכות</p>
            ) : (
              <div className={styles.cardsGrid}>
                {sub.systems.map((sys) => (
                  <SystemCard key={sys.id} system={sys} />
                ))}
              </div>
            )}
          </section>
        ))
      )}

    </main>
  );
}
