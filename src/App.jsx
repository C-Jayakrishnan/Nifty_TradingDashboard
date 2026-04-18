import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useStats } from './hooks/useData'
import AuthPage from './pages/AuthPage'
import WelcomePage from './pages/WelcomePage'
import EdgeDetectionPage from './pages/EdgeDetectionPage'
import TradeLoggingPage from './pages/TradeLoggingPage'
import InsightPage from './pages/InsightPage'
import DeveloperPage from './pages/DeveloperPage'
import { Target, BarChart2, BookOpen, TrendingUp, Wrench, LogOut, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'welcome', Icon: Target,    label: 'Edge'    },
  { id: 'detect',  Icon: BarChart2, label: 'Browse'  },
  { id: 'log',     Icon: BookOpen,  label: 'Journal' },
  { id: 'insight', Icon: TrendingUp,label: 'Insights'},
  { id: 'dev',     Icon: Wrench,    label: 'Dev'     },
]

function Layout() {
  const { user, signOut, loading } = useAuth()
  const { stats } = useStats()
  const [page, setPage] = useState('welcome')
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'linear-gradient(135deg,rgba(0,208,132,0.2),rgba(0,208,132,0.05))',
        border: '1px solid rgba(0,208,132,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Target size={24} color="var(--accent-green)" />
      </div>
      <span className="spinner" />
    </div>
  )

  if (!user) return <AuthPage />

  const statsLoaded = stats != null

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <nav className="sidebar">
        {/* Brand */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(0,208,132,0.25),rgba(0,208,132,0.05))',
              border: '1px solid rgba(0,208,132,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={16} color="var(--accent-green)" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', lineHeight: 1.1 }}>NIFTY Edge</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>v2.2 REACT</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(({ id, Icon, label }) => {
            const active = page === id
            return (
              <button key={id} onClick={() => setPage(id)} className={`sidebar-button ${active ? 'active' : ''}`}>
                <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                {label}
                {id === 'dev' && (
                  <span className="badge badge-red" style={{ fontSize: '9px', padding: '2px 5px', marginLeft: 'auto', letterSpacing: '0.04em' }}>PW</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Stats indicator */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            {statsLoaded
              ? <CheckCircle  size={13} color="var(--accent-green)" />
              : <AlertCircle  size={13} color="var(--accent-red)"   />
            }
            <span style={{ color: 'var(--text-muted)' }}>
              {statsLoaded ? 'Stats loaded' : 'No stats — upload in Dev'}
            </span>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', position: 'relative' }}>
          <button onClick={() => setShowUserMenu(p => !p)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '8px 10px',
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)', transition: 'all var(--transition)',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,var(--accent-green),#007755)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'var(--bg-void)',
            }}>
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
            <ChevronUp size={13} color="var(--text-muted)"
              style={{ flexShrink: 0, transition: 'transform 0.2s', transform: showUserMenu ? '' : 'rotate(180deg)' }} />
          </button>
          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% - 4px)', left: '12px', right: '12px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 200,
            }}>
              <button onClick={() => { signOut(); setShowUserMenu(false) }} style={{
                width: '100%', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '13px',
                textAlign: 'left',
              }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="main-content">
        {page === 'welcome' && <WelcomePage stats={stats} />}
        {page === 'detect'  && <EdgeDetectionPage stats={stats} />}
        {page === 'log'     && <TradeLoggingPage />}
        {page === 'insight' && <InsightPage />}
        {page === 'dev'     && <DeveloperPage />}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        {NAV_ITEMS.map(({ id, Icon, label }) => {
          const active = page === id
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px',
              color: active ? 'var(--accent-green)' : 'var(--text-muted)',
              transition: 'color var(--transition)',
            }}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {label}
              </span>
              {active && <div style={{ width: '16px', height: '2px', background: 'var(--accent-green)', borderRadius: '1px' }} />}
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
