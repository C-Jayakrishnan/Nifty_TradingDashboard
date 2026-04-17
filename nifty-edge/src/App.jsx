import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useStats } from './hooks/useData'
import AuthPage from './pages/AuthPage'
import WelcomePage from './pages/WelcomePage'
import EdgeDetectionPage from './pages/EdgeDetectionPage'
import TradeLoggingPage from './pages/TradeLoggingPage'
import InsightPage from './pages/InsightPage'
import DeveloperPage from './pages/DeveloperPage'

const NAV_ITEMS = [
  { id: 'welcome', icon: '🎯', label: 'Edge' },
  { id: 'detect', icon: '📊', label: 'Browse' },
  { id: 'log', icon: '📝', label: 'Log Trade' },
  { id: 'insight', icon: '💹', label: 'Insights' },
]

function Layout() {
  const { user, isAdmin, signOut, loading } = useAuth()
  const { stats } = useStats()
  const [page, setPage] = useState('welcome')
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '32px' }}>🎯</span>
        <span className="spinner" />
      </div>
    </div>
  )

  if (!user) return <AuthPage />

  const navItems = [...NAV_ITEMS, { id: 'dev', icon: '🛠️', label: 'Dev' }]
  const statsLoaded = stats != null

  return (
    <>
      {/* Sidebar (desktop) */}
      <nav className="sidebar">
        {/* Brand */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px' }}>NIFTY Edge</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em', paddingLeft: '30px' }}>v2.2 REACT</div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: page === item.id ? 'var(--bg-card)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: page === item.id ? 'var(--accent-green)' : 'var(--text-secondary)',
                fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                transition: 'all var(--transition)', textAlign: 'left', width: '100%',
                borderLeft: page === item.id ? '2px solid var(--accent-green)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Stats indicator */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: statsLoaded ? 'var(--accent-green)' : 'var(--accent-red)',
              boxShadow: statsLoaded ? '0 0 6px var(--accent-green)' : 'none'
            }} />
            <span style={{ color: 'var(--text-muted)' }}>
              {statsLoaded ? 'Stats loaded' : 'No stats — upload data'}
            </span>
          </div>
        </div>

        {/* User area */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(p => !p)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', padding: '8px 10px', cursor: 'pointer',
              color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-green), #007755)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'var(--bg-void)', flexShrink: 0,
            }}>
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
              {isAdmin && <div style={{ fontSize: '9px', color: 'var(--accent-gold)', letterSpacing: '0.06em' }}>ADMIN</div>}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⌄</span>
          </button>
          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% - 8px)', left: '14px', right: '14px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 200,
            }}>
              <button className="btn btn-ghost" style={{
                width: '100%', justifyContent: 'flex-start', padding: '10px 14px',
                borderRadius: 0, border: 'none', color: 'var(--accent-red)',
              }} onClick={() => { signOut(); setShowUserMenu(false) }}>
                ↩ Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        {page === 'welcome' && <WelcomePage stats={stats} />}
        {page === 'detect' && <EdgeDetectionPage stats={stats} />}
        {page === 'log' && <TradeLoggingPage />}
        {page === 'insight' && <InsightPage />}
        {page === 'dev' && <DeveloperPage />}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="mobile-nav">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px',
            color: page === item.id ? 'var(--accent-green)' : 'var(--text-muted)',
            transition: 'color var(--transition)',
          }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {item.label}
            </span>
            {page === item.id && (
              <div style={{ width: '16px', height: '2px', background: 'var(--accent-green)', borderRadius: '1px', marginTop: '2px' }} />
            )}
          </button>
        ))}
      </nav>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}
