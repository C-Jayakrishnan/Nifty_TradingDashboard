import { useState, useRef } from 'react'
import { useStats } from '../hooks/useData'
import Papa from 'papaparse'

const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD || 'nifty-dev-2024'

function parseCandleStats(rows) {
  return rows.map(r => ({
    candle_state: r['candle_state'] || '',
    total_count: +r['total_count'] || 0,
    prob_trend_up: +r['prob_trend_up'] || 0,
    prob_trend_down: +r['prob_trend_down'] || 0,
    prob_range_chop: +r['prob_range_chop'] || 0,
    avg_next_day_range_pct: +r['avg_next_day_range_pct'] || 0,
  })).filter(r => r.candle_state)
}

function parseOpenContextStats(rows) {
  return rows.map(r => ({
    open_context: r['open_context'] || '',
    total_count: +r['total_count'] || 0,
    prob_trend_up: +r['prob_trend_up'] || 0,
    prob_trend_down: +r['prob_trend_down'] || 0,
    prob_range_chop: +r['prob_range_chop'] || 0,
    prob_pdh_break_success: +r['prob_pdh_break_success'] || 0,
    prob_pdl_break_success: +r['prob_pdl_break_success'] || 0,
    prob_false_pdh_break: +r['prob_false_pdh_break'] || 0,
    prob_false_pdl_break: +r['prob_false_pdl_break'] || 0,
    avg_next_day_range_pct: +r['avg_next_day_range_pct'] || 0,
  })).filter(r => r.open_context)
}

function parseGapStats(rows) {
  return rows.map(r => ({
    gap_direction: r['gap_direction'] || '',
    gap_bucket: r['gap_bucket'] || '',
    total_count: +r['total_count'] || 0,
    prob_fill_50pct: +r['prob_fill_50pct'] || 0,
    prob_fill_80pct: +r['prob_fill_80pct'] || 0,
    prob_fill_100pct: +r['prob_fill_100pct'] || 0,
    avg_gap_size_pct: +r['avg_gap_size_pct'] || 0,
  })).filter(r => r.gap_direction)
}

function parseLevelGameStats(rows) {
  return rows.map(r => ({
    Date: r['Date'] || '',
    Level: r['Level'] || '',
    LevelValue: +r['LevelValue'] || 0,
    Open: +r['Open'] || 0,
    High: +r['High'] || 0,
    Low: +r['Low'] || 0,
    Close: +r['Close'] || 0,
    FirstTouch: r['FirstTouch'] === 'True' || r['FirstTouch'] === 'true',
    Broken: r['Broken'] === 'True' || r['Broken'] === 'true',
    BrokenDirection: r['BrokenDirection'] || null,
    BreakSuccess: r['BreakSuccess'] === 'True' || r['BreakSuccess'] === 'true',
  })).filter(r => r.Date && r.Level)
}

function parseCSV(text) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true, skipEmptyLines: true,
      complete: r => resolve(r.data),
      error: e => reject(e),
    })
  })
}

function FileSlot({ icon, label, hint, status, onFile }) {
  const ref = useRef()
  const ok = status === 'ok', err = status === 'error'
  return (
    <div
      onClick={() => ref.current?.click()}
      style={{
        border: `1px dashed ${ok ? 'var(--accent-green)' : err ? 'var(--accent-red)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        background: ok ? 'var(--accent-green-dim)' : err ? 'var(--accent-red-dim)' : 'var(--bg-elevated)',
        padding: '14px 16px', cursor: 'pointer',
        transition: 'all var(--transition)', display: 'flex', alignItems: 'center', gap: '12px',
      }}
    >
      <input ref={ref} type="file" accept=".csv" style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: 600, marginBottom: '2px',
          color: ok ? 'var(--accent-green)' : err ? 'var(--accent-red)' : 'var(--text-primary)'
        }}>
          {ok ? '✓ ' : err ? '✗ ' : ''}{label}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{hint}</div>
      </div>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        background: ok ? 'var(--accent-green)' : err ? 'var(--accent-red)' : 'var(--bg-card)',
        border: `1px solid ${ok ? 'var(--accent-green)' : err ? 'var(--accent-red)' : 'var(--border-default)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', color: ok || err ? 'white' : 'var(--text-muted)',
      }}>
        {ok ? '✓' : err ? '✗' : '+'}
      </div>
    </div>
  )
}

export default function DeveloperPage() {
  const { stats, saveStats, clearStats } = useStats()
  const [unlocked, setUnlocked] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState(false)
  const [files, setFiles] = useState({ candle: null, open: null, gap: null, level: null })
  const [statuses, setStatuses] = useState({})
  const [log, setLog] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const setStatus = (k, v) => setStatuses(p => ({ ...p, [k]: v }))
  const addLog = (msg, type = 'info') => setLog(prev => [...prev, { msg, type }])

  const handlePw = (e) => {
    e.preventDefault()
    if (pw === DEV_PASSWORD) { setUnlocked(true); setPwErr(false) }
    else { setPwErr(true); setPw('') }
  }

  const handleFile = (key, parser) => async (file) => {
    try {
      const text = await file.text()
      const rows = await parseCSV(text)
      if (!rows.length) throw new Error('No rows found — check format')
      const parsed = parser(rows)
      if (!parsed.length) throw new Error('Rows parsed but all filtered out — check column names')
      setFiles(p => ({ ...p, [key]: parsed }))
      setStatus(key, 'ok')
      addLog(`✅ ${file.name} — ${parsed.length} rows loaded`)
    } catch (err) {
      setStatus(key, 'error')
      addLog(`❌ ${file.name}: ${err.message}`, 'error')
    }
  }

  const readyCount = Object.values(statuses).filter(s => s === 'ok').length
  const canSave = readyCount >= 4

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    addLog('⚙️ Merging stats and syncing...')
    const newStats = {
      candle_state_stats: files.candle,
      open_context_stats: files.open,
      gap_stats: files.gap,
      level_game_stats: files.level,
      thresholds: { body_70: 0.6, body_30: 0.3 },
      uploaded_at: new Date().toISOString(),
    }
    await saveStats(newStats)
    setSaving(false)
    setSaved(true)
    addLog('🎉 Stats saved and synced to Supabase! All logged-in devices will now use these stats.', 'success')
    setTimeout(() => setSaved(false), 5000)
  }

  // ─── Password gate ─────────────────────────────────────────────────────────
  if (!unlocked) return (
    <div style={{ maxWidth: '400px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>🛠️ Developer</h1>
          <span className="badge badge-red">PROTECTED</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Upload backtest output CSVs to power the dashboard.<br />Enter the developer passphrase to continue.
        </p>
      </div>
      <div className="card" style={{ padding: '28px' }}>
        <form onSubmit={handlePw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Developer Passphrase</label>
            <input
              className="input" type="password" placeholder="••••••••••"
              value={pw} onChange={e => { setPw(e.target.value); setPwErr(false) }}
              autoFocus
              style={{ borderColor: pwErr ? 'var(--accent-red)' : undefined }}
            />
            {pwErr && (
              <div style={{ fontSize: '12px', color: 'var(--accent-red)', marginTop: '4px' }}>
                Incorrect passphrase.
              </div>
            )}
          </div>
          <button className="btn btn-primary" type="submit"
            style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
            Unlock →
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Default: <code style={{ color: 'var(--accent-gold)' }}>nifty-dev-2024</code> · Change via <code style={{ color: 'var(--accent-gold)' }}>VITE_DEV_PASSWORD</code>
        </p>
      </div>
    </div>
  )

  // ─── Unlocked UI ───────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>🛠️ Developer</h1>
            <span className="badge badge-green">UNLOCKED</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Upload pre-computed backtest CSV outputs from your local Python run
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => setUnlocked(false)} style={{ fontSize: '12px' }}>
          🔒 Lock
        </button>
      </div>

      {/* Active stats banner */}
      {stats ? (
        <div className="alert alert-success" style={{ marginBottom: '20px', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            ✅ <strong>Active stats:</strong> {stats.candle_state_stats?.length} candle · {stats.open_context_stats?.length} open · {stats.gap_stats?.length} gap · {stats.level_game_stats?.length} level records
            {stats.uploaded_at && <span style={{ marginLeft: '8px', opacity: 0.7, fontSize: '11px' }}>
              Uploaded {new Date(stats.uploaded_at).toLocaleString('en-IN')}
            </span>}
          </div>
          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '11px' }}
            onClick={() => { clearStats(); setLog(p => [...p, { msg: '🗑️ Stats cleared.', type: 'info' }]) }}>
            Clear
          </button>
        </div>
      ) : (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          ⚠️ No stats loaded. Upload the 4 CSV files below to enable edge detection.
        </div>
      )}

      {/* Workflow guide */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '20px' }}>
        <div className="section-title" style={{ marginBottom: '14px' }}>Workflow</div>
        {[
          { n: '1', title: 'Run backtest_nifty.py on your machine', code: 'python backtest_nifty.py', desc: 'Generates 4 CSV files in the data/ folder' },
          { n: '2', title: 'Upload the 4 output CSVs below', code: null, desc: 'candle_state_stats · open_context_stats · gap_stats · level_game_stats' },
          { n: '3', title: 'Save — syncs instantly to all your devices', code: null, desc: 'Stored in Supabase. Any device signed in will use the latest stats.' },
        ].map(({ n, title, code, desc }, idx, arr) => (
          <div key={n} style={{
            display: 'flex', gap: '14px',
            paddingBottom: idx < arr.length - 1 ? '14px' : 0,
            marginBottom: idx < arr.length - 1 ? '14px' : 0,
            borderBottom: idx < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-green-dim)', border: '1px solid var(--accent-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '12px', color: 'var(--accent-green)'
            }}>{n}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
              {code && <code style={{ display: 'block', fontSize: '12px', color: 'var(--accent-gold)', background: 'var(--bg-void)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', marginBottom: '4px' }}>{code}</code>}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CSV Upload slots */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '16px' }}>
        <div className="section-title" style={{ marginBottom: '14px' }}>
          Upload Files ({readyCount}/4 ready)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          <FileSlot icon="🕯️" label="candle_state_stats.csv" status={statuses.candle}
            hint="candle_state · total_count · prob_trend_up · prob_trend_down · prob_range_chop · avg_next_day_range_pct"
            onFile={handleFile('candle', parseCandleStats)} />
          <FileSlot icon="📍" label="open_context_stats.csv" status={statuses.open}
            hint="open_context · total_count · prob_trend_up/down/range_chop · prob_pdh/pdl_break_success · prob_false_pdh/pdl_break"
            onFile={handleFile('open', parseOpenContextStats)} />
          <FileSlot icon="📉" label="gap_stats.csv" status={statuses.gap}
            hint="gap_direction · gap_bucket · total_count · prob_fill_50pct · prob_fill_80pct · prob_fill_100pct"
            onFile={handleFile('gap', parseGapStats)} />
          <FileSlot icon="📐" label="level_game_stats.csv" status={statuses.level}
            hint="Date · Level · LevelValue · Open · High · Low · Close · FirstTouch · Broken · BrokenDirection · BreakSuccess"
            onFile={handleFile('level', parseLevelGameStats)} />
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[['candle', '🕯️'], ['open', '📍'], ['gap', '📉'], ['level', '📐']].map(([k, ic]) => (
            <span key={k} className={`badge ${statuses[k] === 'ok' ? 'badge-green' : statuses[k] === 'error' ? 'badge-red' : 'badge-muted'}`}>
              {ic} {k} {statuses[k] === 'ok' ? '✓' : statuses[k] === 'error' ? '✗' : '○'}
            </span>
          ))}
        </div>

        <div className="divider" style={{ margin: '0 0 14px' }} />

        {saved && <div className="alert alert-success fade-in" style={{ marginBottom: '12px' }}>🎉 Stats saved and synced to all devices!</div>}

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px' }}
        >
          {saving
            ? <><span className="spinner" style={{ width: '14px', height: '14px' }} /> Syncing...</>
            : canSave
              ? '💾 Save & Sync to All Devices'
              : `Upload ${4 - readyCount} more CSV${4 - readyCount !== 1 ? 's' : ''} to continue`
          }
        </button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="section-title" style={{ flex: 1 }}>Log</div>
            <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => setLog([])}>Clear</button>
          </div>
          <div style={{
            background: 'var(--bg-void)', borderRadius: 'var(--radius-md)',
            padding: '12px 14px', maxHeight: '200px', overflowY: 'auto',
            border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '2px'
          }}>
            {log.map(({ msg, type }, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: '1.7',
                color: type === 'error' ? 'var(--accent-red)' : type === 'success' ? 'var(--accent-green)' : 'var(--text-secondary)'
              }}>{msg}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
