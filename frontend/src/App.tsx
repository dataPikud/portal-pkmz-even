import './App.css'

const systems = [
  {
    name: 'Help Desk',
    description: 'Open support tickets and follow internal requests.',
    url: 'https://example.com/help-desk',
    category: 'Operations',
  },
  {
    name: 'HR Portal',
    description: 'Time off, benefits, forms, and employee services.',
    url: 'https://example.com/hr',
    category: 'People',
  },
  {
    name: 'Knowledge Base',
    description: 'Policies, guides, procedures, and onboarding docs.',
    url: 'https://example.com/kb',
    category: 'Knowledge',
  },
  {
    name: 'Finance',
    description: 'Budgets, purchase requests, invoices, and reports.',
    url: 'https://example.com/finance',
    category: 'Business',
  },
]

function App() {
  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">Organization Portal</p>
          <h1>Start here for every internal system.</h1>
          <p className="intro">
            A single browser home page for core tools, services, and internal
            information across the organization.
          </p>
        </div>
        <div className="status-panel" aria-label="Portal status">
          <span className="status-dot" />
          Portal online
        </div>
      </header>

      <section className="quick-actions" aria-label="Quick actions">
        <a href="https://example.com/announcements">Announcements</a>
        <a href="https://example.com/directory">Directory</a>
        <a href="https://example.com/status">System status</a>
      </section>

      <section className="systems-section">
        <div className="section-heading">
          <h2>Organization systems</h2>
          <p>Replace these placeholders with real systems as the portal grows.</p>
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
