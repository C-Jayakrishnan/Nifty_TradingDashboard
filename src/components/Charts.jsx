import { fmtPct } from '../utils/calculations'

// ─── Semi-circle Gauge ────────────────────────────────────────────────────────
export function Gauge({ value, label, color, size = 100 }) {
  const pct = Math.min(1, Math.max(0, value || 0))
  const radius = 38
  const cx = 50, cy = 50
  const startAngle = Math.PI
  const endAngle = 0
  const angle = startAngle + pct * Math.PI
  const x1 = cx + radius * Math.cos(startAngle)
  const y1 = cy + radius * Math.sin(startAngle)
  const x2 = cx + radius * Math.cos(angle)
  const y2 = cy + radius * Math.sin(angle)
  const largeArc = pct > 0.5 ? 1 : 0

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="20 20 60 40" width={size} height={size * 0.56}>
        {/* Track */}
        <path
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${cx + radius * Math.cos(endAngle)} ${cy + radius * Math.sin(endAngle)}`}
          fill="none" stroke="var(--bg-elevated)" strokeWidth="7" strokeLinecap="round"
        />
        {/* Fill */}
        {pct > 0.02 && (
          <path
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
          />
        )}
        {/* Value text */}
        <text x="50" y="52" textAnchor="middle" fontSize="11"
          fill="var(--text-primary)" fontFamily="'Syne', sans-serif" fontWeight="800">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '-4px' }}>
        {label}
      </div>
    </div>
  )
}

// ─── Probability Row ──────────────────────────────────────────────────────────
export function ProbRow({ label, value, count, total, color = 'var(--accent-green)' }) {
  const pct = Math.min(1, Math.max(0, value || 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {count != null && total != null && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{count}/{total}</span>
          )}
          <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)', color }}>
            {fmtPct(value)}
          </span>
        </div>
      </div>
      <div className="prob-bar">
        <div className="prob-bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Signal Badge ─────────────────────────────────────────────────────────────
export function SignalBadge({ signal }) {
  const map = {
    'BULLISH': { cls: 'badge-green', icon: '📈', text: 'BULLISH BIAS' },
    'BEARISH': { cls: 'badge-red', icon: '📉', text: 'BEARISH BIAS' },
    'NEUTRAL': { cls: 'badge-gold', icon: '➡️', text: 'NEUTRAL' },
  }
  const s = map[signal] || map['NEUTRAL']
  return (
    <span className={`badge ${s.cls}`} style={{ fontSize: '13px', padding: '6px 16px' }}>
      {s.icon} {s.text}
    </span>
  )
}

// ─── CPR Display ─────────────────────────────────────────────────────────────
export function CPRDisplay({ pp, tc, bc }) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {[
        { label: 'TC', value: tc, color: 'var(--accent-green)' },
        { label: 'PP', value: pp, color: 'var(--accent-gold)' },
        { label: 'BC', value: bc, color: 'var(--accent-red)' },
      ].map(({ label, value, color }) => (
        <div key={label} style={{
          flex: 1, minWidth: '80px',
          background: 'var(--bg-elevated)',
          border: `1px solid ${color}44`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>
            {value ?? '—'}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Level Scenario Accordion ─────────────────────────────────────────────────
export function ScenarioAccordion({ scenario, outcomes }) {
  const [open, setOpen] = useState(false)
  const total = outcomes[0]?.total_count ?? 0

  return (
    <div className="accordion" style={{ marginBottom: '8px' }}>
      <div className="accordion-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{scenario}</span>
          <span className="badge badge-muted">{total} days</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '18px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : '' }}>
          ›
        </span>
      </div>
      {open && (
        <div className="accordion-body fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {outcomes.map(o => (
            <ProbRow key={o.outcome} label={o.outcome} value={o.probability}
              count={o.outcome_count} total={o.total_count}
              color={o.probability > 0.6 ? 'var(--accent-green)' : o.probability < 0.35 ? 'var(--accent-red)' : 'var(--accent-gold)'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────
export function StatTile({ label, value, sub, color }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

// useState needed for ScenarioAccordion
import { useState } from 'react'
