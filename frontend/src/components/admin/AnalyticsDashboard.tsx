import { useEffect, useState } from 'react';
import { TrendingUp, Users, Globe, Folder, Film, MousePointerClick, X, Info } from 'lucide-react';
import { api } from '../../lib/api';
import type { AnalyticsOverview, SystemAnalyticsBreakdown } from '../../types';
import styles from './AnalyticsDashboard.module.css';

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSystemId, setSelectedSystemId] = useState<number | null>(null);
  const [systemBreakdown, setSystemBreakdown] = useState<SystemAnalyticsBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.analytics.overview()
      .then(res => setData(res))
      .catch(err => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  function handleOpenSystemBreakdown(systemId: number) {
    setSelectedSystemId(systemId);
    setLoadingBreakdown(true);
    api.analytics.systemBreakdown(systemId)
      .then(res => setSystemBreakdown(res))
      .catch(err => console.error('Failed to load system breakdown:', err))
      .finally(() => setLoadingBreakdown(false));
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>טוען נתונים סטטיסטיים וגרפים...</p>
      </div>
    );
  }

  if (!data) return null;

  // Compute SVG Line Chart coordinates for 14-day timeline
  const timeline = data.timeline;
  const maxCount = Math.max(...timeline.map(t => t.count), 5);
  const chartHeight = 140;
  const chartWidth = 600;

  const points = timeline.map((t, idx) => {
    const x = (idx / (timeline.length - 1)) * chartWidth;
    const y = chartHeight - (t.count / maxCount) * (chartHeight - 20) - 10;
    return { x, y, date: t.date, count: t.count };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Stat Cards Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <MousePointerClick size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{data.totals.visits}</span>
            <span className={styles.statLabel}>סה"כ כניסות וקליקים</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Globe size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{data.totals.systems}</span>
            <span className={styles.statLabel}>מערכות ואתרים</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Folder size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{data.totals.folders}</span>
            <span className={styles.statLabel}>תיקיות היררכיות</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <Film size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{data.totals.videos}</span>
            <span className={styles.statLabel}>סרטוני הדרכה</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Charts Row */}
      <div className={styles.chartsGrid}>
        {/* SVG Timeline Area Chart */}
        <div className={styles.chartBox}>
          <div className={styles.boxHeader}>
            <TrendingUp size={18} color="#3b82f6" />
            <h3>מגמת שימוש בפורטל (14 ימים אחרונים)</h3>
          </div>
          <div className={styles.svgWrap}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.svgChart}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#chartGrad)" />
              <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
              {points.map((p, idx) => (
                <g key={idx} className={styles.chartDotGroup}>
                  <circle cx={p.x} cy={p.y} r="5" className={styles.chartDot} />
                  <title>{`${p.date}: ${p.count} כניסות`}</title>
                </g>
              ))}
            </svg>
            <div className={styles.xAxisLabels}>
              {points.filter((_, idx) => idx % 2 === 0).map((p, idx) => (
                <span key={idx}>{p.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top 5 Most Popular Systems Bar Chart */}
        <div className={styles.chartBox}>
          <div className={styles.boxHeader}>
            <Globe size={18} color="#10b981" />
            <h3>5 המערכות הנצפות ביותר</h3>
          </div>
          <div className={styles.barsList}>
            {data.topSystems.map(sys => (
              <div
                key={sys.systemId}
                className={styles.barRow}
                onClick={() => handleOpenSystemBreakdown(sys.systemId)}
                title="לחץ לפילוח מפורט לפי משתמשים"
              >
                <div className={styles.barMeta}>
                  <span className={styles.barName}>{sys.name}</span>
                  <span className={styles.barCount}>{sys.clickCount} קליקים ({sys.percentage}%)</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${Math.max(sys.percentage, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Top Users Leaderboard */}
      <div className={styles.leaderboardBox}>
        <div className={styles.boxHeader}>
          <Users size={18} color="#f59e0b" />
          <h3>המשתמשים הפעילים ביותר בפורטל (כמה נלחץ וע"י מי)</h3>
        </div>
        <div className={styles.usersGrid}>
          {data.topUsers.map(usr => (
            <div key={usr.userId} className={styles.userCard}>
              <div className={styles.userAvatar}>{usr.displayName.charAt(0)}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{usr.displayName}</span>
                <span className={styles.userSub}>מזהה: {usr.employeeId}</span>
              </div>
              <div className={styles.userBadge}>
                {usr.clickCount} כניסות
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Detailed System Breakdown Modal */}
      {selectedSystemId && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedSystemId(null)}>
          <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <Info size={20} color="#3b82f6" />
                <h3>פילוח כניסות מפורט עבור המערכת</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedSystemId(null)}>
                <X size={18} />
              </button>
            </div>

            {loadingBreakdown ? (
              <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
                <p>טוען פילוח משתמשים...</p>
              </div>
            ) : systemBreakdown ? (
              <div className={styles.breakdownContent}>
                <div className={styles.systemMetaHeader}>
                  <h4>{systemBreakdown.system.name}</h4>
                  <p>סה"כ כניסות שנרשמו: <strong>{systemBreakdown.totalClicks}</strong></p>
                </div>

                <h5 className={styles.breakdownSubTitle}>פירוט משתמשים שנכנסו למערכת זו:</h5>
                <div className={styles.breakdownTable}>
                  <div className={styles.tableHeaderRow}>
                    <span>שם משתמש</span>
                    <span>מספר עובד</span>
                    <span>מספר כניסות</span>
                  </div>
                  {systemBreakdown.userBreakdown.map(ub => (
                    <div key={ub.userId} className={styles.tableDataRow}>
                      <span className={styles.userCell}>{ub.displayName}</span>
                      <span>{ub.employeeId}</span>
                      <span className={styles.countBadge}>{ub.count} פעמים</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
