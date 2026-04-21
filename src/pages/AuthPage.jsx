import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Target, Zap, Lock, Mail, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode]     = useState('login')
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]       = useState(null)

  const handle = async e => {
    e.preventDefault(); setLoading(true); setMsg(null)
    const { error } = await (mode === 'login' ? signIn : signUp)(email, pw)
    if (error) setMsg({ type:'error', text: error.message })
    else if (mode === 'signup') setMsg({ type:'success', text:'Check your email to confirm your account.' })
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative' }}>
      {/* Ambient glow */}
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(0,229,255,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:400, position:'relative' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:60, height:60, borderRadius:16, marginBottom:20,
            background:'linear-gradient(135deg,rgba(0,229,255,0.2),rgba(0,212,180,0.06))',
            border:'1px solid rgba(0,229,255,0.3)',
            boxShadow:'var(--cyan-glow-lg)',
            animation:'float 3s ease-in-out infinite',
          }}>
            <Target size={28} color="var(--cyan)" strokeWidth={2} />
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, letterSpacing:'0.12em', marginBottom:8, color:'var(--text-primary)' }}>
            NIFTY EDGE
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
            Statistical Edge Detection · NIFTY 50
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:'linear-gradient(135deg,rgba(22,31,46,0.95),rgba(15,21,32,0.9))',
          border:'1px solid var(--border-subtle)',
          borderRadius:'var(--radius-2xl)',
          padding:28,
          backdropFilter:'blur(20px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.04)',
          position:'relative', overflow:'hidden',
        }}>
          {/* Top shimmer line */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(0,229,255,0.3),transparent)' }} />

          {/* Tabs */}
          <div className="tab-bar" style={{ marginBottom:24 }}>
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
            <button className={`tab-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
          </div>

          {/* Google */}
          <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginBottom:16, padding:'11px 16px' }}
            onClick={() => { setLoading(true); signInWithGoogle() }}>
            <svg width="16" height="16" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'4px 0 16px' }}>
            <div style={{ flex:1, height:1, background:'var(--border-subtle)' }} />
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>OR</span>
            <div style={{ flex:1, height:1, background:'var(--border-subtle)' }} />
          </div>

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="label">Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={14} color="var(--text-muted)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input className="input" type="email" placeholder="trader@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  style={{ paddingLeft:36 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={14} color="var(--text-muted)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input className="input" type="password" placeholder="••••••••"
                  value={pw} onChange={e => setPw(e.target.value)} required
                  style={{ paddingLeft:36 }} />
              </div>
            </div>
            {msg && (
              <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`} style={{ alignItems:'center', fontSize:12 }}>
                {msg.text}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px 20px',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              background:'linear-gradient(90deg,rgba(0,229,255,0.15),rgba(0,212,180,0.1))',
              border:'1px solid rgba(0,229,255,0.3)',
              borderRadius:'var(--radius-md)',
              color:'var(--cyan)', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, letterSpacing:'0.1em',
              transition:'all var(--transition)',
              boxShadow: loading ? 'none' : 'var(--cyan-glow)',
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? <span className="spinner" style={{ width:16, height:16 }} />
                : <>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'} <ArrowRight size={14} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:20, fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.06em' }}>
          STATISTICAL ANALYSIS · EDUCATIONAL PURPOSE ONLY
        </p>
      </div>
    </div>
  )
}
