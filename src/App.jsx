import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useStats } from './hooks/useData'
import AuthPage from './pages/AuthPage'
import WelcomePage from './pages/WelcomePage'
import EdgeDetectionPage from './pages/EdgeDetectionPage'
import TradeLoggingPage from './pages/TradeLoggingPage'
import InsightPage from './pages/InsightPage'
import DeveloperPage from './pages/DeveloperPage'
import { Target, BarChart2, BookOpen, TrendingUp, Wrench, LogOut, CheckCircle, AlertCircle } from 'lucide-react'

const NAV = [
  { id: 'welcome', Icon: Target,     label: 'Edge'     },
  { id: 'detect',  Icon: BarChart2,  label: 'Browse'   },
  { id: 'log',     Icon: BookOpen,   label: 'Journal'  },
  { id: 'insight', Icon: TrendingUp, label: 'Insights' },
  { id: 'dev',     Icon: Wrench,     label: 'Dev'      },
]

function Layout() {
  const { user, signOut, loading } = useAuth()
  const { stats } = useStats()
  const [page, setPage]         = useState('welcome')
  const [showMenu, setShowMenu] = useState(false)
  const [time, setTime]         = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Splash screen in index.html handles the loading visual — just return null here
  if (loading) return null

  if (!user) return <AuthPage />

  const statsOk  = !!stats
  const initials = user.email?.[0]?.toUpperCase()
  const fmt      = t => t.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const fmtDate  = t => t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

  return (
    <>
      {/* ══ Desktop Sidebar (72px icon rail) ══ */}
      <nav className="sidebar" style={{ alignItems: 'center' }}>

        {/* Logo */}
        <div style={{ padding: '16px 0 14px', borderBottom: '1px solid var(--border-subtle)', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/logo.png"
            alt="NIFTY Edge"
            style={{
              width: 44, height: 44,
              borderRadius: 12,
              objectFit: 'cover',
              objectPosition: 'center',
              boxShadow: '0 0 18px rgba(0,229,255,0.25), 0 0 0 1px rgba(0,229,255,0.15)',
              display: 'block',
            }}
          />
        </div>

        {/* Nav icons */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 0' }}>
          {NAV.map(({ id, Icon, label }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                title={label}
                style={{
                  width: 52, height: 52,
                  borderRadius: 12,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: active ? 'linear-gradient(135deg,rgba(0,229,255,0.15),rgba(0,212,180,0.07))' : 'transparent',
                  border: active ? '1px solid rgba(0,229,255,0.22)' : '1px solid transparent',
                  color: active ? 'var(--cyan)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all var(--transition)',
                  boxShadow: active ? '0 0 16px rgba(0,229,255,0.1)' : 'none',
                  position: 'relative',
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 22, borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(180deg,var(--cyan),var(--teal))',
                    boxShadow: 'var(--cyan-glow)',
                  }} />
                )}
                <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Stats indicator + user avatar */}
        <div style={{ padding: '10px 0 14px', borderTop: '1px solid var(--border-subtle)', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div title={statsOk ? 'Stats loaded' : 'No stats — upload in Dev'}>
            {statsOk
              ? <CheckCircle size={15} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 5px var(--teal))' }} />
              : <AlertCircle size={15} color="var(--red)" />
            }
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(p => !p)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--teal),#006655)',
                border: '1.5px solid rgba(0,212,180,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#050810',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              }}
            >
              {initials}
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(13,20,32,0.97)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 300,
                minWidth: 150, backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ padding: '8px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-subtle)', letterSpacing: '0.06em' }}>
                  {user.email}
                </div>
                <button
                  onClick={() => { signOut(); setShowMenu(false) }}
                  style={{
                    width: '100%', padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'left',
                  }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ══ Main Content ══ */}
      <main className="main-content">

        {/* Sticky top header bar */}
        <div style={{
          padding: '10px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          background: 'rgba(9,13,22,0.85)', backdropFilter: 'blur(16px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--cyan)' }}>
              {NAV.find(n => n.id === page)?.label?.toUpperCase()}
            </span>
            <div style={{ width: 1, height: 12, background: 'var(--border-default)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              NIFTY EDGE · v2.2
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className="live-dot" />
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>LIVE</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.06em', lineHeight: 1.2 }}>
                {fmt(time)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                {fmtDate(time)}
              </div>
            </div>
          </div>
        </div>

        {/* Page content — maxWidth + auto margins to prevent blank side sprawl */}
        <div style={{ padding: '20px 24px 32px', maxWidth: 1080, width: '100%', margin: '0 auto' }}>
          {page === 'welcome' && <WelcomePage stats={stats} />}
          {page === 'detect'  && <EdgeDetectionPage stats={stats} />}
          {page === 'log'     && <TradeLoggingPage />}
          {page === 'insight' && <InsightPage />}
          {page === 'dev'     && <DeveloperPage />}
        </div>
      </main>

      {/* ══ Mobile Bottom Nav ══ */}
      <nav className="mobile-nav">
        {NAV.map(({ id, Icon, label }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px',
                color: active ? 'var(--cyan)' : 'var(--text-muted)',
                transition: 'color var(--transition)', position: 'relative',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 20, height: 2, background: 'var(--cyan)',
                  borderRadius: '0 0 2px 2px', boxShadow: 'var(--cyan-glow)',
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
