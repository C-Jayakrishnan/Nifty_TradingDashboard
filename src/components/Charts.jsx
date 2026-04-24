import { useState, useEffect, useMemo } from 'react'
import { fmtPct } from '../utils/calculations'
import { TrendingUp, TrendingDown, Minus, ChevronDown, Activity, Target, Zap, Brain } from 'lucide-react'

function CountUpNumber({ value, duration = 850, format = v => Math.round(v) }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0
    let frameId
    let startTime

    const tick = ts => {
      if (!startTime) startTime = ts
      const progress = Math.min(1, (ts - startTime) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(target * eased)
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration])

  return <>{format(display)}</>
}

export function Gauge({ value, label, color, size = 120, subtitle, actionLabel }) {
  const pct = Math.min(1, Math.max(0, value || 0))
  const R = 44
  const circumference = Math.PI * R
  const filled = pct * circumference
  const arcPath = `M ${50 - R} 50 A ${R} ${R} 0 0 1 ${50 + R} 50`

  const colorMap = {
    'var(--green)': 'rgba(57,255,133,0.18)',
    'var(--red)': 'rgba(255,61,107,0.18)',
    'var(--amber)': 'rgba(255,182,39,0.18)',
    'var(--cyan)': 'rgba(0,229,255,0.18)',
    'var(--teal)': 'rgba(0,212,180,0.18)',
  }
  const glowColor = colorMap[color] || 'rgba(0,229,255,0.18)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: size }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: size, filter: 'drop-shadow(0 18px 34px rgba(0,0,0,0.3))' }}>
        <div style={{
          position: 'absolute',
          inset: '12% 10% 22%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: 0.95,
          pointerEvents: 'none',
        }} />
        <svg viewBox="0 0 100 70" width="100%" height="auto" style={{ overflow: 'visible', position: 'relative', display: 'block' }}>
          <path d={arcPath} fill="none" stroke={glowColor} strokeWidth="15" strokeLinecap="round" />
          <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
          <circle cx="50" cy="50" r="4" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
          <text
            x="50"
            y="39"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fontFamily="'JetBrains Mono',monospace"
            fill="rgba(255,255,255,0.34)"
            letterSpacing="0.14em"
          >
            LIVE EDGE
          </text>
          <text
            x="50"
            y="53"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="800"
            fontFamily="'Orbitron',monospace"
            fill={color}
          >
            <CountUpNumber value={pct * 100} format={v => Math.round(v)} />
          </text>
          <text
            x="50"
            y="62"
            textAnchor="middle"
            fontSize="5.5"
            fontWeight="600"
            fontFamily="'JetBrains Mono',monospace"
            fill="rgba(255,255,255,0.42)"
            letterSpacing="0.16em"
          >
            CONFIDENCE
          </text>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ marginTop: 5, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
        {actionLabel && (
          <div style={{ marginTop: 8 }}>
            <span className="badge badge-blue" style={{ paddingInline: 12 }}>{actionLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function DonutChart({ up, chop, down, size = 140 }) {
  const r = 42
  const cx = 70
  const cy = 70
  const circ = 2 * Math.PI * r
  const total = (up || 0) + (chop || 0) + (down || 0)
  const norm = total > 0 ? v => v / total : () => 0

  const segments = [
    { value: norm(up), color: 'var(--green)', glow: 'rgba(57,255,133,0.4)', label: 'UP' },
    { value: norm(chop), color: 'var(--amber)', glow: 'rgba(255,182,39,0.35)', label: 'CHOP' },
    { value: norm(down), color: 'var(--red)', glow: 'rgba(255,61,107,0.35)', label: 'DOWN' },
  ]

  let offset = 0
  const arcs = segments.map(s => {
    const dash = s.value * circ
    const gap = circ - dash
    const arc = { ...s, dash, gap, offset }
    offset += dash
    return arc
  })

  const dominant = segments.reduce((a, b) => (a.value > b.value ? a : b))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: size }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: size, aspectRatio: '1 / 1' }}>
        <div style={{
          position: 'absolute',
          inset: '20%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${dominant.glow} 0%, transparent 68%)`,
          filter: 'blur(8px)',
        }} />
        <svg viewBox="0 0 140 140" width="100%" height="100%" style={{ position: 'relative' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
          {arcs.map((arc, i) => arc.dash > 0.5 && (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth="10"
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                filter: `drop-shadow(0 0 5px ${arc.glow})`,
                transition: 'all 1s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ))}
          <text
            x="70"
            y="64"
            textAnchor="middle"
            fontSize="22"
            fontWeight="900"
            fontFamily="'Orbitron',monospace"
            fill={dominant.color}
          >
            <CountUpNumber value={dominant.value * 100} format={v => `${Math.round(v)}%`} />
          </text>
          <text
            x="70"
            y="78"
            textAnchor="middle"
            fontSize="7"
            fontWeight="700"
            fontFamily="'JetBrains Mono',monospace"
            fill="var(--text-muted)"
            letterSpacing="0.1em"
          >
            {dominant.label} DAY
          </text>
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              {s.label} {Math.round(s.value * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProbRow({ label, value, count, total, color = 'var(--teal)' }) {
  const pct = Math.min(1, Math.max(0, value || 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
          {count != null && total != null && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{count}/{total}</span>
          )}
          <span
            className="number-pop"
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color,
              minWidth: 40,
              textAlign: 'right',
              textShadow: `0 0 8px ${color}55`,
            }}
          >
            {fmtPct(value)}
          </span>
        </div>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 999, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            borderRadius: 999,
            width: `${pct * 100}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 8px ${color}44`,
            transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  )
}

export function SignalBadge({ signal }) {
  const map = {
    BULLISH: { color: 'var(--green)', bg: 'rgba(57,255,133,0.08)', border: 'rgba(57,255,133,0.24)', Icon: TrendingUp, text: 'BULLISH BIAS' },
    BEARISH: { color: 'var(--red)', bg: 'rgba(255,61,107,0.08)', border: 'rgba(255,61,107,0.24)', Icon: TrendingDown, text: 'BEARISH BIAS' },
    NEUTRAL: { color: 'var(--amber)', bg: 'rgba(255,182,39,0.08)', border: 'rgba(255,182,39,0.24)', Icon: Minus, text: 'WAIT / NEUTRAL' },
  }
  const s = map[signal] || map.NEUTRAL
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 14px',
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.08em',
      }}
    >
      <s.Icon size={13} strokeWidth={2.5} />
      {s.text}
    </span>
  )
}

export function CPRDisplay({ pp, tc, bc }) {
  const numericLevels = [tc, pp, bc]
    .map(v => Number(v))
    .filter(v => Number.isFinite(v))
  const max = numericLevels.length ? Math.max(...numericLevels) : 0
  const min = numericLevels.length ? Math.min(...numericLevels) : 0
  const spread = Math.max(max - min, 1)

  const levels = [
    { label: 'TC', full: 'Top Central', value: tc, color: 'var(--green)', glow: 'rgba(57,255,133,0.18)' },
    { label: 'PP', full: 'Pivot Point', value: pp, color: 'var(--amber)', glow: 'rgba(255,182,39,0.18)' },
    { label: 'BC', full: 'Bottom Central', value: bc, color: 'var(--red)', glow: 'rgba(255,61,107,0.18)' },
  ].map(level => {
    const numeric = Number(level.value)
    const ratio = Number.isFinite(numeric) ? (numeric - min) / spread : 0.5
    return { ...level, ratio }
  })

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {levels.map(({ label, full, value, color, glow, ratio }) => (
        <div
          key={label}
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: '18px',
            padding: '12px 14px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color, fontFamily: 'var(--font-mono)' }}>
                {label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                {full}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-primary)' }}>
              {value ?? '—'}
            </div>
          </div>
          <div style={{ position: 'relative', height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, transparent 0%, ${glow} 35%, transparent 100%)`,
              animation: 'shimmer 3.4s linear infinite',
            }} />
            <div
              style={{
                position: 'absolute',
                inset: '1px auto 1px 1px',
                width: `${Math.max(18, ratio * 100)}%`,
                borderRadius: 999,
                background: `linear-gradient(90deg, ${color}88, ${color})`,
                boxShadow: `0 0 12px ${glow}`,
                transition: 'width 0.8s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                left: `calc(${Math.max(18, ratio * 100)}% - 7px)`,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 12px ${color}`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ScenarioAccordion({ scenario, outcomes }) {
  const [open, setOpen] = useState(false)
  const total = outcomes[0]?.total_count ?? 0
  const best = outcomes.reduce((a, b) => (a.probability > b.probability ? a : b), outcomes[0] || { probability: 0 })
  const bestColor = best.probability > 0.6 ? 'var(--green)' : best.probability < 0.35 ? 'var(--red)' : 'var(--amber)'

  return (
    <div
      style={{
        border: `1px solid ${open ? 'rgba(0,229,255,0.15)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 8,
        transition: 'all var(--transition)',
        boxShadow: open ? '0 0 20px rgba(0,229,255,0.04)' : 'none',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 16px',
          background: open ? 'rgba(0,229,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background var(--transition)',
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: best.probability > 0.6 ? 'var(--green)' : best.probability < 0.35 ? 'var(--red)' : 'var(--amber)',
            boxShadow: `0 0 6px ${bestColor}`,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', marginBottom: 2 }}>
            {scenario}
          </div>
          {!open && best.probability > 0 && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Best: <span style={{ color: bestColor }}>{best.outcome} · {Math.round(best.probability * 100)}%</span>
            </div>
          )}
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--border-subtle)' }}>
          {total}d
        </span>
        <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : '' }} />
      </button>
      {open && (
        <div className="fade-in" style={{ padding: '14px 16px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-subtle)' }}>
          {outcomes.map(o => (
            <ProbRow
              key={o.outcome}
              label={o.outcome}
              value={o.probability}
              count={o.outcome_count}
              total={o.total_count}
              color={o.probability > 0.6 ? 'var(--green)' : o.probability < 0.35 ? 'var(--red)' : 'var(--amber)'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function StatTile({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="stat-tile">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-label">{label}</div>
        {Icon && <Icon size={14} color="var(--text-muted)" strokeWidth={1.5} />}
      </div>
      <div className="stat-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function SectionHeading({ children, icon: Icon, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={13} color="var(--cyan)" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 4px var(--cyan))' }} />}
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {children}
        </span>
        <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg,rgba(0,229,255,0.2),transparent)' }} />
      </div>
      {action}
    </div>
  )
}

export function ChipGroup({ label, options, value, onChange, icons, colorMap }) {
  const defaultColors = { Yes: 'green', No: 'red', 'Going Up': 'green', 'Falling Down': 'red', Sideways: 'amber' }
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((opt, i) => {
          const selected = value === opt
          const Icon = icons?.[i]
          const c = colorMap?.[opt] || defaultColors[opt] || 'cyan'
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`chip ${selected ? `selected-${c === 'cyan' ? 'selected' : c}` : ''}`}
            >
              {Icon && <Icon size={12} strokeWidth={2} />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function InsightPanel({ signal, candleState, openContext, gap }) {
  const insights = useMemo(() => {
    const items = []
    if (!signal) return items

    if (signal === 'NEUTRAL') items.push({ text: 'Mixed probability stack. Wait for confirmation after the opening range before committing size.', type: 'warn' })
    if (signal === 'BULLISH') items.push({ text: 'Upside edge is in control. Favor continuation only if price accepts above key levels and volume confirms.', type: 'bull' })
    if (signal === 'BEARISH') items.push({ text: 'Downside pressure dominates. Prioritize breakdown entries and keep failed bounces on a short leash.', type: 'bear' })

    if (candleState?.includes('Compression')) items.push({ text: 'Compression context suggests expansion is likely. Expect a sharper move once range breaks.', type: 'warn' })
    if (candleState?.includes('Exhaustion')) items.push({ text: 'Exhaustion signature detected. Chasing late momentum is lower quality than fade setups.', type: 'warn' })
    if (candleState?.includes('Strong_Acceptance')) items.push({ text: 'Strong acceptance pattern supports trend continuation rather than mean reversion.', type: 'bull' })

    if (openContext?.includes('Inside_CPR')) items.push({ text: 'Opening inside CPR often rewards patience. Let the first directional auction settle before entry.', type: 'info' })
    if (gap?.direction === 'Gap_Up') items.push({ text: `Gap up of ${gap.sizePct?.toFixed(2)}% is on the board. Watch for either continuation above the open or fade back toward prior close.`, type: 'info' })
    if (gap?.direction === 'Gap_Down') items.push({ text: `Gap down of ${gap.sizePct?.toFixed(2)}% creates two-way risk. Failed recovery attempts can accelerate lower quickly.`, type: 'info' })

    return items
  }, [signal, candleState, openContext, gap])

  if (!insights.length) return null

  const typeStyle = {
    bull: { color: 'var(--green)', border: 'rgba(57,255,133,0.15)', bg: 'rgba(57,255,133,0.04)', title: 'Trend Continuation' },
    bear: { color: 'var(--red)', border: 'rgba(255,61,107,0.15)', bg: 'rgba(255,61,107,0.04)', title: 'Risk Pressure' },
    warn: { color: 'var(--amber)', border: 'rgba(255,182,39,0.15)', bg: 'rgba(255,182,39,0.04)', title: 'Execution Filter' },
    info: { color: 'var(--cyan)', border: 'rgba(0,229,255,0.15)', bg: 'rgba(0,229,255,0.04)', title: 'Context Read' },
  }

  const primaryAction =
    signal === 'BULLISH' ? 'Lean long on confirmation' :
    signal === 'BEARISH' ? 'Lean short on breakdown' :
    'Wait for confirmation'

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <SectionHeading icon={Brain} action={<span className="badge badge-purple">{primaryAction}</span>}>
        Insight Engine
      </SectionHeading>
      <div style={{
        marginBottom: 14,
        padding: '14px 16px',
        borderRadius: 18,
        border: '1px solid rgba(0,229,255,0.12)',
        background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(0,212,180,0.03))',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
          Suggested Action
        </div>
        <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 4 }}>
          {primaryAction}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          Keep the first trade aligned with the bias engine, then scale only after price validates the setup.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.map((ins, i) => {
          const s = typeStyle[ins.type]
          return (
            <div
              key={i}
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 16,
                padding: '12px 14px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                animation: `fadeIn 0.3s ease ${i * 0.1}s both`,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}`, marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, color: s.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {s.title}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                  {ins.text}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
