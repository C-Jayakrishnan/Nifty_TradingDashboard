import { useState } from 'react'
import { useTrades } from '../hooks/useData'
import { calcPnL, fmtNum, fmtPct } from '../utils/calculations'
import { SectionHeading } from '../components/Charts'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Target, Trash2, Activity, BarChart2, Shield, CheckCircle, XCircle, Minus } from 'lucide-react'

function KpiCard({ label, value, sub, color, Icon, trend }) {
  return (
    <div style={{
      background:'linear-gradient(135deg,rgba(22,31,46,0.9),rgba(15,21,32,0.8))',
      border:'1px solid var(--border-subtle)',
      borderRadius:'var(--radius-xl)',
      padding:'16px 18px',
      position:'relative', overflow:'hidden',
      transition:'all var(--transition)',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color ? color + '33' : 'var(--border-default)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Top accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color ? `linear-gradient(90deg,${color}88,${color}22)` : 'transparent', borderRadius:'var(--radius-xl) var(--radius-xl) 0 0' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{label}</span>
        {Icon && <Icon size={14} color={color || 'var(--text-muted)'} strokeWidth={1.8} style={{ opacity:0.7 }} />}
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:color || 'var(--text-primary)', lineHeight:1, marginBottom:4, textShadow: color ? `0 0 16px ${color}55` : 'none' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'rgba(15,21,32,0.95)', border:'1px solid var(--border-default)', borderRadius:10, padding:'10px 14px', fontFamily:'JetBrains Mono', fontSize:11, backdropFilter:'blur(8px)' }}>
      <div style={{ color:'var(--text-muted)', marginBottom:4, letterSpacing:'0.06em' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.value >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
          {p.name}: ₹{fmtNum(Math.abs(p.value), 0)} {p.value >= 0 ? '↑' : '↓'}
        </div>
      ))}
    </div>
  )
}

export default function InsightPage() {
  const { trades, clearAllTrades, deleteTrade, loading } = useTrades()
  const [confirmClear, setConfirmClear] = useState(false)

  const closedTrades = trades
    .filter(t => t.exit_price != null)
    .map(t => ({ ...t, pnl: calcPnL(t) }))
    .sort((a,b) => new Date(a.trade_date) - new Date(b.trade_date))

  const allTrades = [...trades].sort((a,b) => new Date(b.trade_date) - new Date(a.trade_date))

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:14, paddingTop:60, justifyContent:'center' }}>
      <span className="spinner" />
      <span style={{ color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:12, letterSpacing:'0.1em' }}>LOADING TRADES…</span>
    </div>
  )

  if (trades.length === 0) return (
    <div style={{ maxWidth:500, paddingTop:40, textAlign:'center' }}>
      <div style={{ width:56, height:56, borderRadius:16, background:'rgba(0,229,255,0.06)', border:'1px solid rgba(0,229,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
        <BarChart2 size={24} color="var(--cyan)" strokeWidth={1.5} />
      </div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:16, letterSpacing:'0.1em', marginBottom:10 }}>NO TRADES YET</h2>
      <p style={{ color:'var(--text-muted)', fontSize:12, fontFamily:'var(--font-mono)', marginBottom:20 }}>Log your first trade in the Journal tab to see analytics.</p>
    </div>
  )

  // Compute metrics
  const totalPnL      = closedTrades.reduce((s,t) => s + t.pnl, 0)
  const winners       = closedTrades.filter(t => t.pnl > 0)
  const losers        = closedTrades.filter(t => t.pnl < 0)
  const winRate       = closedTrades.length ? winners.length / closedTrades.length : 0
  const grossProfit   = winners.reduce((s,t) => s + t.pnl, 0)
  const grossLoss     = Math.abs(losers.reduce((s,t) => s + t.pnl, 0))
  const profitFactor  = grossLoss > 0 ? grossProfit / grossLoss : null
  const avgWin        = winners.length ? grossProfit / winners.length : 0
  const avgLoss       = losers.length  ? grossLoss  / losers.length  : 0
  const avgRisk       = trades.reduce((s,t) => s + (+t.risk_amount||0), 0) / trades.length
  const discipline    = trades.filter(t => t.pre_trade_data_flag === 'Yes').length / trades.length

  // Equity curve
  let cum = 0
  const equityCurve = closedTrades.map(t => {
    cum += t.pnl
    return { date: t.trade_date?.slice(5), cum:+cum.toFixed(2), pnl:+t.pnl.toFixed(2) }
  })

  const pnlColor = totalPnL >= 0 ? 'var(--green)' : 'var(--red)'
  const winColor = winRate > 0.55 ? 'var(--green)' : winRate < 0.4 ? 'var(--red)' : 'var(--amber)'
  const pfColor  = !profitFactor ? 'var(--text-muted)' : profitFactor > 1.5 ? 'var(--green)' : profitFactor < 1 ? 'var(--red)' : 'var(--amber)'
  const discColor = discipline > 0.8 ? 'var(--green)' : discipline > 0.5 ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{ maxWidth:920 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, letterSpacing:'0.1em', marginBottom:6 }}>TRADE INSIGHTS</h1>
          <p style={{ color:'var(--text-muted)', fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.06em' }}>
            {trades.length} LOGGED · {closedTrades.length} CLOSED · {winners.length} WINNERS · {losers.length} LOSERS
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {confirmClear ? (
            <>
              <button className="btn btn-danger" style={{ fontSize:11 }}
                onClick={() => { clearAllTrades(); setConfirmClear(false) }}>
                <Trash2 size={12} /> Confirm
              </button>
              <button className="btn btn-ghost" style={{ fontSize:11 }} onClick={() => setConfirmClear(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-ghost" style={{ fontSize:11, color:'var(--red)', borderColor:'rgba(255,61,107,0.2)' }}
              onClick={() => setConfirmClear(true)}>
              <Trash2 size={12} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
        <KpiCard label="Total P&L"      value={`₹${fmtNum(totalPnL,0)}`}    color={pnlColor}  Icon={totalPnL >= 0 ? TrendingUp : TrendingDown} />
        <KpiCard label="Win Rate"       value={fmtPct(winRate)}              color={winColor}  Icon={Target} />
        <KpiCard label="Profit Factor"  value={profitFactor ? fmtNum(profitFactor,2) : '—'} color={pfColor} Icon={BarChart2} />
        <KpiCard label="Avg Risk"       value={`₹${fmtNum(avgRisk,0)}`}      color="var(--amber)" Icon={Shield} />
        <KpiCard label="Discipline"     value={fmtPct(discipline)}           color={discColor} Icon={Activity}
          sub={`${trades.filter(t=>t.pre_trade_data_flag==='Yes').length}/${trades.length} pre-planned`} />
      </div>

      {/* Secondary metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
        <KpiCard label="Avg Win"  value={`₹${fmtNum(avgWin,0)}`}  color="var(--green)"  />
        <KpiCard label="Avg Loss" value={`₹${fmtNum(avgLoss,0)}`} color="var(--red)"    />
        <KpiCard label="Gross Profit" value={`₹${fmtNum(grossProfit,0)}`} color="var(--green)" />
        <KpiCard label="Gross Loss"   value={`₹${fmtNum(grossLoss,0)}`}   color="var(--red)"   />
      </div>

      {closedTrades.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:14 }}>
          {/* Equity curve */}
          <div className="card" style={{ padding:'18px 20px' }}>
            <SectionHeading icon={TrendingUp}>Equity Curve</SectionHeading>
            <div style={{ height:180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="cum" stroke="var(--teal)" strokeWidth={2}
                    fill="url(#eqGrad)" name="Cumulative P&L"
                    dot={false} activeDot={{ r:4, fill:'var(--cyan)', strokeWidth:0 }}
                    style={{ filter:'drop-shadow(0 0 4px var(--teal))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-trade bars */}
          <div className="card" style={{ padding:'18px 20px' }}>
            <SectionHeading icon={BarChart2}>Trade P&L</SectionHeading>
            <div style={{ height:180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equityCurve} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                  <XAxis dataKey="date" tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />
                  <Bar dataKey="pnl" name="P&L" radius={[3,3,0,0]}>
                    {equityCurve.map((e,i) => (
                      <Cell key={i}
                        fill={e.pnl >= 0 ? 'var(--green)' : 'var(--red)'}
                        style={{ filter: e.pnl >= 0 ? 'drop-shadow(0 0 4px var(--green))' : 'drop-shadow(0 0 4px var(--red))' }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Trade table */}
      <div className="card" style={{ padding:'18px 20px' }}>
        <SectionHeading icon={Activity}>All Trades</SectionHeading>
        <div className="table-wrap" style={{ borderRadius:'var(--radius-lg)' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Edge</th>
                <th>Direction</th>
                <th>Instrument</th>
                <th>Entry</th>
                <th>SL</th>
                <th>Exit</th>
                <th>P&L</th>
                <th>Pre-planned</th>
                <th>Exit Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allTrades.map(t => {
                const pnl = calcPnL(t)
                const pnlColor = pnl == null ? 'var(--text-muted)' : pnl >= 0 ? 'var(--green)' : 'var(--red)'
                return (
                  <tr key={t.id}>
                    <td style={{ color:'var(--text-secondary)', whiteSpace:'nowrap', fontFamily:'var(--font-mono)', fontSize:11 }}>{t.trade_date}</td>
                    <td><span className="badge badge-blue" style={{ fontSize:9 }}>{t.edge_type?.split(' ')[0]}</span></td>
                    <td>
                      {t.market_direction === 'Going Up'
                        ? <TrendingUp size={13} color="var(--green)" />
                        : t.market_direction === 'Falling Down'
                        ? <TrendingDown size={13} color="var(--red)" />
                        : <Minus size={13} color="var(--amber)" />
                      }
                    </td>
                    <td style={{ fontSize:11, whiteSpace:'nowrap', color:'var(--text-secondary)' }}>{t.instrument}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)' }}>{fmtNum(t.entry_price)}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--red)' }}>{fmtNum(t.stop_loss)}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{t.exit_price ? fmtNum(t.exit_price) : <span style={{ color:'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:pnlColor, textShadow:`0 0 8px ${pnlColor}66` }}>
                      {pnl != null ? `₹${fmtNum(pnl,0)}` : '—'}
                    </td>
                    <td>
                      {t.pre_trade_data_flag === 'Yes'
                        ? <CheckCircle size={13} color="var(--green)" style={{ filter:'drop-shadow(0 0 4px var(--green))' }} />
                        : <XCircle size={13} color="var(--red)" />
                      }
                    </td>
                    <td style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{t.exit_reason || '—'}</td>
                    <td>
                      <button onClick={() => deleteTrade(t.id)} style={{
                        background:'none', border:'none', cursor:'pointer', padding:'4px 6px',
                        color:'var(--text-muted)', borderRadius:'var(--radius-sm)',
                        transition:'all var(--transition)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,61,107,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
