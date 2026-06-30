import './App.css'

const systems = [
  {
    name: 'מוקד תמיכה',
    description: 'פתיחת קריאות שירות ומעקב אחר בקשות פנים ארגוניות.',
    url: 'https://example.com/help-desk',
    category: 'תפעול',
  },
  {
    name: 'פורטל משאבי אנוש',
    description: 'חופשות, הטבות, טפסים ושירותים לעובדים.',
    url: 'https://example.com/hr',
    category: 'אנשים',
  },
  {
    name: 'מאגר ידע',
    description: 'נהלים, מדריכים, תהליכים ומסמכי קליטה.',
    url: 'https://example.com/kb',
    category: 'ידע',
  },
  {
    name: 'כספים',
    description: 'תקציבים, בקשות רכש, חשבוניות ודוחות.',
    url: 'https://example.com/finance',
    category: 'עסקי',
  },
]

function App() {
  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">פורטל ארגוני</p>
          <h1>נקודת הכניסה לכל המערכות הפנימיות.</h1>
          <p className="intro">
            דף הבית הארגוני מרכז כלים מרכזיים, שירותים ומידע פנימי במקום אחד
            נגיש וברור.
          </p>
        </div>
        <div className="status-panel" aria-label="סטטוס הפורטל">
          <span className="status-dot" />
          הפורטל פעיל
        </div>
      </header>

      <section className="quick-actions" aria-label="פעולות מהירות">
        <a href="https://example.com/announcements">הודעות ועדכונים</a>
        <a href="https://example.com/directory">ספר טלפונים</a>
        <a href="https://example.com/status">סטטוס מערכות</a>
      </section>

      <section className="systems-section">
        <div className="section-heading">
          <h2>מערכות הארגון</h2>
          <p>בהמשך ניתן להחליף את הקישורים לדוגמא במערכות האמיתיות של הארגון.</p>
        </div>
        <div className="systems-grid">
          {systems.map((system) => (
            <a className="system-card" href={system.url} key={system.name}>
              <span>{system.category}</span>
              <h3>{system.name}</h3>
              <p>{system.description}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
