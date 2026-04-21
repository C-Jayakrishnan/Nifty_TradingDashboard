import { useState } from 'react'
import { fmtPct } from '../utils/calculations'
import { TrendingUp, TrendingDown, Minus, ChevronDown, Activity, Target, Zap, Brain } from 'lucide-react'

// ── Fixed Gauge (dasharray-based) ─────────────────────────────────────────────
export function Gauge({ value, label, color, size = 120 }) {
  const pct = Math.min(1, Math.max(0, value || 0))
  const R = 36
  const circumference = Math.PI * R
  const filled = pct * circumference
  const arcPath = `M ${50 - R} 50 A ${R} ${R} 0 0 1 ${50 + R} 50`

  const colorMap = {
    'var(--green)': 'rgba(57,255,133,0.25)',
    'var(--red)': 'rgba(255,61,107,0.25)',
    'var(--amber)': 'rgba(255,182,39,0.25)',
    'var(--cyan)': 'rgba(0,229,255,0.25)',
    'var(--teal)': 'rgba(0,212,180,0.25)',
  }
  const glowColor = colorMap[color] || 'rgba(0,229,255,0.25)'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ position:'relative', width:size }}>
        <svg viewBox="12 16 76 38" width={size} height={size * 0.55} style={{ overflow:'visible' }}>
          {/* Outer glow track */}
          <path d={arcPath} fill="none" stroke={glowColor} strokeWidth="10" strokeLinecap="round" />
          {/* Track */}
          <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" strokeLinecap="round" />
          {/* Fill */}
          <path d={arcPath} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ filter:`drop-shadow(0 0 6px ${color})`, transition:'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Center value */}
          <text x="50" y="48" textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fontWeight="800" fontFamily="'Orbitron',monospace" fill={color}
            style={{ textShadow:`0 0 8px ${color}` }}>
            {Math.round(pct * 100)}
          </text>
          <text x="50" y="55.5" textAnchor="middle"
            fontSize="5" fontWeight="600" fontFamily="'JetBrains Mono',monospace" fill="rgba(255,255,255,0.3)"
            letterSpacing="0.08em">
            PCT
          </text>
        </svg>
      </div>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
        {label}
      </div>
    </div>
  )
}

// ── Donut Chart (Candle game) ──────────────────────────────────────────────────
export function DonutChart({ up, chop, down, size = 140 }) {
  const r = 42, cx = 70, cy = 70
  const circ = 2 * Math.PI * r
  const total = (up||0) + (chop||0) + (down||0)
  const norm = total > 0 ? v => v / total : () => 0

  const segments = [
    { value: norm(up),   color:'var(--green)',  glow:'rgba(57,255,133,0.4)',  label:'UP'   },
    { value: norm(chop), color:'var(--amber)',  glow:'rgba(255,182,39,0.4)',  label:'CHOP' },
    { value: norm(down), color:'var(--red)',    glow:'rgba(255,61,107,0.4)',  label:'DOWN' },
  ]

  let offset = 0
  const arcs = segments.map(s => {
    const dash = s.value * circ
    const gap  = circ - dash
    const arc  = { ...s, dash, gap, offset }
    offset += dash
    return arc
  })

  const dominant = segments.reduce((a, b) => a.value > b.value ? a : b)
  const domPct   = Math.round(dominant.value * 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg viewBox="0 0 140 140" width={size} height={size}>
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
          {arcs.map((arc, i) => arc.dash > 0.5 && (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={arc.color} strokeWidth="10"
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%',
                filter:`drop-shadow(0 0 5px ${arc.glow})`,
                transition:'all 1s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ))}
          {/* Center */}
          <text x="70" y="64" textAnchor="middle" fontSize="22" fontWeight="900"
            fontFamily="'Orbitron',monospace" fill={dominant.color}
            style={{ filter:`drop-shadow(0 0 6px ${dominant.color})` }}>
            {domPct}%
          </text>
          <text x="70" y="78" textAnchor="middle" fontSize="7" fontWeight="700"
            fontFamily="'JetBrains Mono',monospace" fill="var(--text-muted)" letterSpacing="0.1em">
            {dominant.label} DAY
          </text>
        </svg>
      </div>
      {/* Legend */}
      <div style={{ display:'flex', gap:12 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, boxShadow:`0 0 6px ${s.color}` }} />
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.06em' }}>
              {s.label} {Math.round(s.value * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Prob Row ──────────────────────────────────────────────────────────────────
export function ProbRow({ label, value, count, total, color = 'var(--teal)' }) {
  const pct = Math.min(1, Math.max(0, value || 0))
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-body)' }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, marginLeft:8 }}>
          {count != null && total != null && (
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{count}/{total}</span>
          )}
          <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--font-display)', color, minWidth:40, textAlign:'right',
            textShadow:`0 0 8px ${color}88` }}>
            {fmtPct(value)}
          </span>
        </div>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.04)', borderRadius:2, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:2, width:`${pct * 100}%`,
          background:`linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow:`0 0 8px ${color}66`,
          transition:'width 0.9s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

// ── Signal Badge ──────────────────────────────────────────────────────────────
export function SignalBadge({ signal }) {
  const map = {
    BULLISH: { color:'var(--green)',  bg:'rgba(57,255,133,0.1)',  border:'rgba(57,255,133,0.3)',  Icon:TrendingUp,   text:'BULLISH BIAS' },
    BEARISH: { color:'var(--red)',    bg:'rgba(255,61,107,0.1)',  border:'rgba(255,61,107,0.3)',  Icon:TrendingDown, text:'BEARISH BIAS' },
    NEUTRAL: { color:'var(--amber)',  bg:'rgba(255,182,39,0.1)',  border:'rgba(255,182,39,0.3)',  Icon:Minus,        text:'NEUTRAL' },
  }
  const s = map[signal] || map.NEUTRAL
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:7,
      padding:'6px 14px', borderRadius:100,
      background:s.bg, border:`1px solid ${s.border}`, color:s.color,
      fontSize:12, fontWeight:700, fontFamily:'var(--font-mono)', letterSpacing:'0.08em',
      textShadow:`0 0 10px ${s.color}88`,
      boxShadow:`0 0 16px ${s.bg}`,
    }}>
      <s.Icon size={13} strokeWidth={2.5} />
      {s.text}
    </span>
  )
}

// ── CPR Display ───────────────────────────────────────────────────────────────
export function CPRDisplay({ pp, tc, bc }) {
  const levels = [
    { label:'TC', full:'Top Central',    value:tc, color:'var(--green)',  border:'rgba(57,255,133,0.2)',  bg:'rgba(57,255,133,0.05)'  },
    { label:'PP', full:'Pivot Point',    value:pp, color:'var(--amber)',  border:'rgba(255,182,39,0.2)',  bg:'rgba(255,182,39,0.05)'  },
    { label:'BC', full:'Bottom Central', value:bc, color:'var(--red)',    border:'rgba(255,61,107,0.2)',  bg:'rgba(255,61,107,0.05)'  },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
      {levels.map(({ label, full, value, color, border, bg }) => (
        <div key={label} style={{
          background:bg, border:`1px solid ${border}`,
          borderTop:`2px solid ${color}`,
          borderRadius:'var(--radius-md)',
          padding:'12px 10px', textAlign:'center',
          transition:'all var(--transition)',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 0%, ${bg} 0%, transparent 70%)`, pointerEvents:'none' }} />
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color, marginBottom:6, fontFamily:'var(--font-mono)', textShadow:`0 0 8px ${color}88` }}>
            {label}
          </div>
          <div style={{
            fontFamily:'var(--font-display)', fontWeight:700,
            fontSize:'clamp(13px,2.5vw,20px)', color:'var(--text-primary)',
            wordBreak:'break-all', lineHeight:1.1,
          }}>
            {value ?? '—'}
          </div>
          <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:4, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'var(--font-mono)' }}>{full}</div>
        </div>
      ))}
    </div>
  )
}

// ── Scenario Accordion ────────────────────────────────────────────────────────
export function ScenarioAccordion({ scenario, outcomes }) {
  const [open, setOpen] = useState(false)
  const total = outcomes[0]?.total_count ?? 0
  const best  = outcomes.reduce((a, b) => a.probability > b.probability ? a : b, outcomes[0] || { probability:0 })
  const bestColor = best.probability > 0.6 ? 'var(--green)' : best.probability < 0.35 ? 'var(--red)' : 'var(--amber)'

  return (
    <div style={{
      border:`1px solid ${open ? 'rgba(0,229,255,0.15)' : 'var(--border-subtle)'}`,
      borderRadius:'var(--radius-lg)', overflow:'hidden', marginBottom:8,
      transition:'all var(--transition)',
      boxShadow: open ? '0 0 20px rgba(0,229,255,0.04)' : 'none',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        padding:'13px 16px',
        background: open ? 'rgba(0,229,255,0.04)' : 'rgba(255,255,255,0.02)',
        border:'none', cursor:'pointer', transition:'background var(--transition)',
      }}>
        <div style={{
          width:6, height:6, borderRadius:'50%',
          background: best.probability > 0.6 ? 'var(--green)' : best.probability < 0.35 ? 'var(--red)' : 'var(--amber)',
          boxShadow:`0 0 6px ${bestColor}`,
          flexShrink:0,
        }} />
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-body)', marginBottom:2 }}>{scenario}</div>
          {!open && best.probability > 0 && (
            <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
              Best: <span style={{ color:bestColor }}>{best.outcome} · {Math.round(best.probability * 100)}%</span>
            </div>
          )}
        </div>
        <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', background:'rgba(255,255,255,0.04)', padding:'2px 8px', borderRadius:100, border:'1px solid var(--border-subtle)' }}>{total}d</span>
        <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink:0, transition:'transform 0.2s', transform:open ? 'rotate(180deg)' : '' }} />
      </button>
      {open && (
        <div className="fade-in" style={{ padding:'14px 16px', background:'var(--bg-card)', display:'flex', flexDirection:'column', gap:12, borderTop:'1px solid var(--border-subtle)' }}>
          {outcomes.map(o => (
            <ProbRow key={o.outcome} label={o.outcome} value={o.probability}
              count={o.outcome_count} total={o.total_count}
              color={o.probability > 0.6 ? 'var(--green)' : o.probability < 0.35 ? 'var(--red)' : 'var(--amber)'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────
export function StatTile({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="stat-tile">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div className="stat-label">{label}</div>
        {Icon && <Icon size={14} color="var(--text-muted)" strokeWidth={1.5} />}
      </div>
      <div className="stat-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

// ── Section Heading ───────────────────────────────────────────────────────────
export function SectionHeading({ children, icon: Icon, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {Icon && <Icon size={13} color="var(--cyan)" strokeWidth={2} style={{ filter:'drop-shadow(0 0 4px var(--cyan))' }} />}
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
          {children}
        </span>
        <div style={{ width:32, height:1, background:'linear-gradient(90deg,rgba(0,229,255,0.2),transparent)' }} />
      </div>
      {action}
    </div>
  )
}

// ── Chip Group ────────────────────────────────────────────────────────────────
export function ChipGroup({ label, options, value, onChange, icons, colorMap }) {
  const defaultColors = { 'Yes':'green', 'No':'red', 'Going Up':'green', 'Falling Down':'red', 'Sideways':'amber' }
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {options.map((opt, i) => {
          const selected = value === opt
          const Icon = icons?.[i]
          const c = colorMap?.[opt] || defaultColors[opt] || 'cyan'
          return (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className={`chip ${selected ? `selected-${c === 'cyan' ? 'selected' : c}` : ''}`}
              style={selected ? {} : {}}>
              {Icon && <Icon size={12} strokeWidth={2} />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── AI Insights Panel ─────────────────────────────────────────────────────────
export function InsightPanel({ signal, candleState, openContext, gap }) {
  const insights = []
  if (!signal) return null

  if (signal === 'NEUTRAL') insights.push({ text:'Mixed signals detected — wait for intraday price action confirmation before entering', type:'warn' })
  if (signal === 'BULLISH') insights.push({ text:'Statistical edge favours upside — look for PDH breakout or CPR TC acceptance', type:'bull' })
  if (signal === 'BEARISH') insights.push({ text:'Statistical edge favours downside — look for PDL breakdown or CPR BC rejection', type:'bear' })

  if (candleState?.includes('Compression')) insights.push({ text:'Compression candle suggests potential range expansion — widen SL accordingly', type:'warn' })
  if (candleState?.includes('Exhaustion')) insights.push({ text:'Exhaustion pattern — avoid chasing breakouts, fades more likely', type:'warn' })
  if (candleState?.includes('Strong_Acceptance')) insights.push({ text:'Strong trend day structure — momentum continuation trades preferred', type:'bull' })

  if (gap?.direction === 'Gap_Up') insights.push({ text:`Gap up of ${gap.sizePct?.toFixed(2)}% detected — gap fill probability exists, manage risk at prev close`, type:'info' })
  if (gap?.direction === 'Gap_Down') insights.push({ text:`Gap down of ${gap.sizePct?.toFixed(2)}% detected — bounce or continuation depends on opening range behaviour`, type:'info' })

  if (!insights.length) return null

  const typeStyle = {
    bull: { color:'var(--green)', border:'rgba(57,255,133,0.15)', bg:'rgba(57,255,133,0.04)' },
    bear: { color:'var(--red)',   border:'rgba(255,61,107,0.15)', bg:'rgba(255,61,107,0.04)' },
    warn: { color:'var(--amber)', border:'rgba(255,182,39,0.15)', bg:'rgba(255,182,39,0.04)' },
    info: { color:'var(--cyan)',  border:'rgba(0,229,255,0.15)',  bg:'rgba(0,229,255,0.04)'  },
  }

  return (
    <div className="card" style={{ padding:'20px 22px' }}>
      <SectionHeading icon={Brain}>AI Insight Engine</SectionHeading>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {insights.map((ins, i) => {
          const s = typeStyle[ins.type]
          return (
            <div key={i} style={{
              background:s.bg, border:`1px solid ${s.border}`, borderRadius:'var(--radius-md)',
              padding:'10px 14px', display:'flex', gap:10, alignItems:'flex-start',
              animation:`fadeIn 0.3s ease ${i * 0.1}s both`,
            }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:s.color, boxShadow:`0 0 6px ${s.color}`, marginTop:5, flexShrink:0 }} />
              <span style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-body)', lineHeight:1.6 }}>{ins.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
