import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fn = mode === 'login' ? signIn : signUp
    const { error } = await fn(email, password)
    if (error) setMsg({ type: 'error', text: error.message })
    else if (mode === 'signup') setMsg({ type: 'success', text: 'Check your email to confirm your account.' })
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 60%, rgba(0,208,132,0.06) 0%, transparent 70%)'
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(0,208,132,0.2), rgba(0,208,132,0.05))',
            border: '1px solid rgba(0,208,132,0.3)',
            marginBottom: '16px', fontSize: '26px'
          }}>🎯</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
            NIFTY Edge
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Statistical Edge Detection for NIFTY 50
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px' }}>
          {/* Tab */}
          <div className="tab-bar" style={{ marginBottom: '24px' }}>
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
              Sign In
            </button>
            <button className={`tab-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>
              Sign Up
            </button>
          </div>

          {/* Google */}
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
            onClick={() => { setLoading(true); signInWithGoogle() }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0 16px' }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>or</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="trader@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {msg && (
              <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>
                {msg.text}
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Statistical analysis tool for educational purposes only.
        </p>
      </div>
    </div>
  )
}
