import { useState } from 'react'
import { fmtPct } from '../utils/calculations'
import {
  TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle,
  ChevronDown, Activity, Target, Zap
} from 'lucide-react'

// ─── Fixed Semi-circle Gauge ──────────────────────────────────────────────────
// Uses stroke-dasharray/dashoffset approach — no arc math bugs
export function Gauge({ value, label, color, size = 110 }) {
  const pct = Math.min(1, Math.max(0, value || 0))
  const R = 36
  const cx = 50, cy = 50
  // Full semicircle circumference
  const circumference = Math.PI * R  // ~113.1
  const filled = pct * circumference
  const gap = circumference - filled

  // Semicircle arc: left point to right point going clockwise over the top
  const arcPath = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`

  const pctInt = Math.round(pct * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size * 0.6 }}>
        <svg
          viewBox="10 14 80 40"
          width={size}
          height={size * 0.6}
          style={{ overflow: 'visible' }}
        >
          {/* Track */}
          <path d={arcPath} fill="none"
            stroke="var(--bg-elevated)" strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Filled arc via dasharray */}
          <path d={arcPath} fill="none"
            stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap + 2}`}
            strokeDashoffset="0"
            style={{
              filter: `drop-shadow(0 0 5px ${color}99)`,
              transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
          {/* Percentage value centred in arc */}
          <text
            x="50" y="49"
            textAnchor="middle" dominantBaseline="middle"
            fontSize="12" fontWeight="800"
            fontFamily="'Syne', sans-serif"
            fill="var(--text-primary)"
          >
            {pctInt}%
          </text>
        </svg>
      </div>
      <div style={{
        fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {label}
      </div>
    </div>
  )
}

// ─── Probability Row ──────────────────────────────────────────────────────────
export function ProbRow({ label, value, count, total, color = 'var(--accent-green)' }) {
  const pct = Math.min(1, Math.max(0, value || 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
          {count != null && total != null && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{count}/{total}</span>
          )}
          <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-display)', color, minWidth: '38px', textAlign: 'right' }}>
            {fmtPct(value)}
          </span>
        </div>
      </div>
      <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '3px',
          width: `${pct * 100}%`,
          background: color,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 6px ${color}66`,
        }} />
      </div>
    </div>
  )
}

// ─── Signal Badge ─────────────────────────────────────────────────────────────
export function SignalBadge({ signal }) {
  const map = {
    BULLISH: { cls: 'badge-green', Icon: TrendingUp, text: 'BULLISH BIAS' },
    BEARISH: { cls: 'badge-red',   Icon: TrendingDown, text: 'BEARISH BIAS' },
    NEUTRAL: { cls: 'badge-gold',  Icon: Minus, text: 'NEUTRAL' },
  }
  const s = map[signal] || map.NEUTRAL
  return (
    <span className={`badge ${s.cls}`} style={{ fontSize: '13px', padding: '7px 16px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
      <s.Icon size={14} strokeWidth={2.5} />
      {s.text}
    </span>
  )
}

// ─── CPR Display — fixed overlap ─────────────────────────────────────────────
export function CPRDisplay({ pp, tc, bc }) {
  const levels = [
    { label: 'TC', fullLabel: 'Top Central', value: tc, color: 'var(--accent-green)', border: 'rgba(0,208,132,0.25)' },
    { label: 'PP', fullLabel: 'Pivot Point',  value: pp, color: 'var(--accent-gold)',  border: 'rgba(255,211,42,0.25)' },
    { label: 'BC', fullLabel: 'Bottom Central', value: bc, color: 'var(--accent-red)', border: 'rgba(255,71,87,0.25)' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
      {levels.map(({ label, fullLabel, value, color, border }) => (
        <div key={label} style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${border}`,
          borderTop: `3px solid ${color}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 10px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, marginBottom: '6px' }}>
            {label}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(14px, 3vw, 22px)',
            color: 'var(--text-primary)',
            wordBreak: 'break-all',
            lineHeight: 1.1,
          }}>
            {value ?? '—'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{fullLabel}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Scenario Accordion ───────────────────────────────────────────────────────
export function ScenarioAccordion({ scenario, outcomes }) {
  const [open, setOpen] = useState(false)
  const total = outcomes[0]?.total_count ?? 0
  const bestOutcome = outcomes.reduce((a, b) => a.probability > b.probability ? a : b, outcomes[0])

  return (
    <div style={{
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: '8px',
      transition: 'border-color var(--transition)',
      ...(open ? { borderColor: 'var(--border-default)' } : {}),
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px',
          background: open ? 'var(--bg-hover)' : 'var(--bg-elevated)',
          border: 'none', cursor: 'pointer',
          transition: 'background var(--transition)',
        }}
      >
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
            {scenario}
          </div>
          {!open && bestOutcome && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Best: <span style={{ color: bestOutcome.probability > 0.6 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
                {bestOutcome.outcome} ({Math.round(bestOutcome.probability * 100)}%)
              </span>
            </div>
          )}
        </div>
        <span className="badge badge-muted" style={{ fontSize: '10px', flexShrink: 0 }}>{total}d</span>
        <ChevronDown size={16} color="var(--text-muted)"
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : '' }} />
      </button>
      {open && (
        <div className="fade-in" style={{ padding: '14px 16px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
export function StatTile({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="stat-tile">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-label">{label}</div>
        {Icon && <Icon size={16} color="var(--text-muted)" strokeWidth={1.5} />}
      </div>
      <div className="stat-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

// ─── Chip Toggle (replaces radio-option) ─────────────────────────────────────
export function ChipGroup({ label, options, value, onChange, icons }) {
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map((opt, i) => {
          const selected = value === opt
          const Icon = icons?.[i]
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                borderRadius: '100px',
                border: `1.5px solid ${selected ? 'var(--accent-green)' : 'var(--border-default)'}`,
                background: selected ? 'var(--accent-green-dim)' : 'var(--bg-surface)',
                color: selected ? 'var(--accent-green)' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: selected ? 700 : 500,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 140ms ease',
                boxShadow: selected ? '0 0 0 3px rgba(0,208,132,0.12)' : 'none',
              }}
            >
              {Icon && <Icon size={13} strokeWidth={2} />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Section Heading with icon ────────────────────────────────────────────────
export function SectionHeading({ children, icon: Icon, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {Icon && <Icon size={15} color="var(--text-muted)" strokeWidth={2} />}
        <span style={{
          fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>{children}</span>
      </div>
      {action}
    </div>
  )
}
