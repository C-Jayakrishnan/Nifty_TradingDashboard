import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useStats } from './hooks/useData'
import AuthPage from './pages/AuthPage'
import WelcomePage from './pages/WelcomePage'
import EdgeDetectionPage from './pages/EdgeDetectionPage'
import TradeLoggingPage from './pages/TradeLoggingPage'
import InsightPage from './pages/InsightPage'
import DeveloperPage from './pages/DeveloperPage'
import { Target, BarChart2, BookOpen, TrendingUp, Wrench, LogOut, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react'

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
  const [page, setPage]           = useState('welcome')
  const [showMenu, setShowMenu]   = useState(false)
  const [time, setTime]           = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20 }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:13, color:'var(--cyan)', letterSpacing:'0.2em', animation:'pulse 1.5s ease infinite' }}>
        INITIALIZING
      </div>
      <span className="spinner" />
    </div>
  )

  if (!user) return <AuthPage />

  const statsOk = !!stats
  const initials = user.email?.[0]?.toUpperCase()
  const fmt = t => t.toLocaleTimeString('en-IN', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const fmtDate = t => t.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase()

  return (
    <>
      {/* ── Icon Sidebar ── */}
      <nav className="sidebar" style={{ alignItems:'center' }}>
        {/* Logo */}
        <div style={{ padding:'20px 0 16px', borderBottom:'1px solid var(--border-subtle)', width:'100%', display:'flex', justifyContent:'center' }}>
          <div style={{
            width:40, height:40, borderRadius:12,
            background:'linear-gradient(135deg,rgba(0,229,255,0.2),rgba(0,212,180,0.08))',
            border:'1px solid rgba(0,229,255,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'var(--cyan-glow)',
          }}>
            <Target size={18} color="var(--cyan)" strokeWidth={2} />
          </div>
        </div>

        {/* Nav icons */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'12px 0' }}>
          {NAV.map(({ id, Icon, label }) => {
            const active = page === id
            return (
              <button key={id} onClick={() => setPage(id)} title={label} style={{
                width:48, height:48, borderRadius:12,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
                background: active ? 'linear-gradient(135deg,rgba(0,229,255,0.15),rgba(0,212,180,0.08))' : 'transparent',
                border: active ? '1px solid rgba(0,229,255,0.25)' : '1px solid transparent',
                color: active ? 'var(--cyan)' : 'var(--text-muted)',
                cursor:'pointer', transition:'all var(--transition)',
                boxShadow: active ? '0 0 16px rgba(0,229,255,0.12)' : 'none',
                position:'relative',
              }}>
                {active && (
                  <div style={{
                    position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
                    width:3, height:20, borderRadius:'0 2px 2px 0',
                    background:'linear-gradient(180deg,var(--cyan),var(--teal))',
                    boxShadow:'var(--cyan-glow)',
                  }} />
                )}
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize:8, fontFamily:'var(--font-mono)', letterSpacing:'0.06em', textTransform:'uppercase', lineHeight:1 }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Stats + user */}
        <div style={{ padding:'12px 0', borderTop:'1px solid var(--border-subtle)', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div title={statsOk ? 'Stats loaded' : 'No stats'}>
            {statsOk
              ? <CheckCircle size={16} color="var(--teal)" style={{ filter:'drop-shadow(0 0 6px var(--teal))' }} />
              : <AlertCircle size={16} color="var(--red)" />
            }
          </div>
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowMenu(p => !p)} style={{
              width:36, height:36, borderRadius:'50%',
              background:'linear-gradient(135deg,var(--teal),#006655)',
              border:'1.5px solid rgba(0,212,180,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', color:'#050810',
              fontFamily:'var(--font-display)', fontSize:13, fontWeight:700,
            }}>{initials}</button>
            {showMenu && (
              <div style={{
                position:'absolute', bottom:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)',
                background:'var(--bg-elevated)', border:'1px solid var(--border-default)',
                borderRadius:'var(--radius-md)', overflow:'hidden', zIndex:200,
                minWidth:140, backdropFilter:'blur(12px)',
                boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{ padding:'8px 12px', fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', borderBottom:'1px solid var(--border-subtle)', letterSpacing:'0.06em' }}>
                  {user.email?.split('@')[0].toUpperCase()}
                </div>
                <button onClick={() => { signOut(); setShowMenu(false) }} style={{
                  width:'100%', padding:'10px 12px',
                  display:'flex', alignItems:'center', gap:8,
                  background:'none', border:'none', cursor:'pointer',
                  color:'var(--red)', fontFamily:'var(--font-mono)', fontSize:12, textAlign:'left',
                }}>
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Top header bar */}
        <div style={{
          padding:'12px 28px', borderBottom:'1px solid var(--border-subtle)',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
          background:'rgba(9,13,22,0.8)', backdropFilter:'blur(12px)',
          position:'sticky', top:0, zIndex:50,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, letterSpacing:'0.15em', color:'var(--cyan)' }}>
              {NAV.find(n => n.id === page)?.label?.toUpperCase()}
            </span>
            <div style={{ width:1, height:14, background:'var(--border-default)' }} />
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.06em' }}>
              NIFTY EDGE · v2.2
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div className="live-dot" />
              <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.06em' }}>LIVE</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600, color:'var(--text-primary)', letterSpacing:'0.06em', lineHeight:1.2 }}>
                {fmt(time)}
              </div>
              <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>
                {fmtDate(time)}
              </div>
            </div>
          </div>
        </div>

        <div className="page-wrap">
          {page === 'welcome' && <WelcomePage stats={stats} />}
          {page === 'detect'  && <EdgeDetectionPage stats={stats} />}
          {page === 'log'     && <TradeLoggingPage />}
          {page === 'insight' && <InsightPage />}
          {page === 'dev'     && <DeveloperPage />}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        {NAV.map(({ id, Icon, label }) => {
          const active = page === id
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              background:'none', border:'none', cursor:'pointer', padding:'6px 4px',
              color: active ? 'var(--cyan)' : 'var(--text-muted)',
              transition:'color var(--transition)',
              position:'relative',
            }}>
              {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:20, height:2, background:'var(--cyan)', borderRadius:'0 0 2px 2px', boxShadow:'var(--cyan-glow)' }} />}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
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
