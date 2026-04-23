import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useStats } from './hooks/useData'
import AuthPage from './pages/AuthPage'
import WelcomePage from './pages/WelcomePage'
import EdgeDetectionPage from './pages/EdgeDetectionPage'
import TradeLoggingPage from './pages/TradeLoggingPage'
import InsightPage from './pages/InsightPage'
import DeveloperPage from './pages/DeveloperPage'
import {
  Target,
  BarChart2,
  BookOpen,
  TrendingUp,
  Wrench,
  LogOut,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Radar,
} from 'lucide-react'

const NAV = [
  { id: 'welcome', Icon: Target, label: 'Edge' },
  { id: 'detect', Icon: BarChart2, label: 'Browse' },
  { id: 'log', Icon: BookOpen, label: 'Journal' },
  { id: 'insight', Icon: TrendingUp, label: 'Insights' },
  { id: 'dev', Icon: Wrench, label: 'Dev' },
]

function Layout() {
  const { user, signOut, loading } = useAuth()
  const { stats } = useStats()
  const [page, setPage] = useState('welcome')
  const [showMenu, setShowMenu] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (loading) return null
  if (!user) return <AuthPage />

  const statsOk = !!stats
  const initials = user.email?.[0]?.toUpperCase()
  const activeLabel = NAV.find(n => n.id === page)?.label?.toUpperCase()
  const fmt = t => t.toLocaleTimeString('en-IN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const fmtDate = t => t.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()

  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-logo-wrap">
          <div className="sidebar-brand-mark">
            <img src="/logo.png" alt="NIFTY Edge" className="logo-img" />
          </div>
          <div className="sidebar-brand-copy">
            <span className="sidebar-eyebrow">Nifty Edge</span>
            <strong className="sidebar-title">Command Center</strong>
          </div>
        </div>

        <div className="sidebar-nav">
          {NAV.map(({ id, Icon, label }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                title={label}
                className={`sidebar-nav-btn ${active ? 'active' : ''}`}
              >
                <span className="sidebar-nav-indicator" />
                <span className="sidebar-nav-icon">
                  <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span className="sidebar-nav-copy">
                  <span className="sidebar-nav-kicker">Module</span>
                  <span className="sidebar-nav-label">{label}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-status" title={statsOk ? 'Stats loaded' : 'No stats - upload in Dev'}>
            {statsOk
              ? <CheckCircle size={15} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 5px var(--teal))' }} />
              : <AlertCircle size={15} color="var(--red)" />
            }
            <div className="sidebar-status-copy">
              <span className="sidebar-eyebrow">System</span>
              <span>{statsOk ? 'Models synced' : 'Awaiting data'}</span>
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <button onClick={() => setShowMenu(p => !p)} className="sidebar-avatar-btn">
              <span className="sidebar-avatar">{initials}</span>
              <span className="sidebar-avatar-copy">
                <span className="sidebar-eyebrow">Operator</span>
                <span className="sidebar-user-email">{user.email}</span>
              </span>
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                background: 'rgba(13,20,32,0.97)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                zIndex: 300,
                minWidth: 180,
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{
                  padding: '8px 12px',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  borderBottom: '1px solid var(--border-subtle)',
                  letterSpacing: '0.06em',
                }}>
                  {user.email}
                </div>
                <button
                  onClick={() => { signOut(); setShowMenu(false) }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--red)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="app-shell-ambient">
          <div className="app-shell-ring ring-a" />
          <div className="app-shell-ring ring-b" />
          <div className="app-shell-gridline grid-a" />
          <div className="app-shell-gridline grid-b" />
        </div>

        <div className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--cyan)' }}>
              {activeLabel}
            </span>
            <div style={{ width: 1, height: 12, background: 'var(--border-default)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              NIFTY EDGE · v2.2
            </span>
          </div>

          <div className="top-header-status">
            <div className="header-chip">
              <Sparkles size={12} />
              Premium Flow
            </div>
            <div className="header-chip">
              <Radar size={12} />
              Signal Matrix
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className="live-dot" />
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                LIVE
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.06em',
                lineHeight: 1.2,
              }}>
                {fmt(time)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                {fmtDate(time)}
              </div>
            </div>
          </div>
        </div>

        <div className="page-shell">
          {page === 'welcome' && <WelcomePage stats={stats} />}
          {page === 'detect' && <EdgeDetectionPage stats={stats} />}
          {page === 'log' && <TradeLoggingPage />}
          {page === 'insight' && <InsightPage />}
          {page === 'dev' && <DeveloperPage />}
        </div>
      </main>

      <nav className="mobile-nav">
        {NAV.map(({ id, Icon, label }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 4px',
                color: active ? 'var(--cyan)' : 'var(--text-muted)',
                transition: 'color var(--transition)',
                position: 'relative',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 2,
                  background: 'var(--cyan)',
                  borderRadius: '0 0 2px 2px',
                  boxShadow: 'var(--cyan-glow)',
                }} />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

export default function App() {
  return <AuthProvider><Layout /></AuthProvider>
}
