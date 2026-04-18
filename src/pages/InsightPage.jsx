import { useState } from 'react'
import { useTrades } from '../hooks/useData'
import { calcPnL, fmtNum, fmtPct } from '../utils/calculations'
import { StatTile } from '../components/Charts'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

export default function InsightPage() {
  const { trades, clearAllTrades, deleteTrade, loading } = useTrades()
  const [confirmClear, setConfirmClear] = useState(false)

  const closedTrades = trades
    .filter(t => t.exit_price != null)
    .map(t => ({ ...t, pnl: calcPnL(t) }))
    .sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))

  const allTrades = [...trades].sort((a, b) => new Date(b.trade_date) - new Date(a.trade_date))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '40px' }}>
      <span className="spinner" />
      <span style={{ color: 'var(--text-muted)' }}>Loading trades…</span>
    </div>
  )

  if (trades.length === 0) return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '20px' }}>
        📊 Trade Insights
      </h1>
      <div className="alert alert-info">No trades logged yet. Use the Trade Logging page to record your first trade.</div>
    </div>
  )

  // Stats
  const totalPnL = closedTrades.reduce((s, t) => s + t.pnl, 0)
  const winners = closedTrades.filter(t => t.pnl > 0)
  const losers = closedTrades.filter(t => t.pnl < 0)
  const winRate = closedTrades.length ? winners.length / closedTrades.length : 0
  const grossProfit = winners.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null
  const avgRisk = trades.reduce((s, t) => s + (+t.risk_amount || 0), 0) / trades.length
  const discipline = trades.filter(t => t.pre_trade_data_flag === 'Yes').length / trades.length

  // Equity curve data
  let cum = 0
  const equityCurve = closedTrades.map(t => {
    cum += t.pnl
    return { date: t.trade_date?.slice(5), cum: +cum.toFixed(2), pnl: +t.pnl.toFixed(2) }
  })

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.value >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {p.name}: ₹{fmtNum(p.value)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            📊 Trade Insights
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            {trades.length} trades logged · {closedTrades.length} closed
          </p>
        </div>
        {!confirmClear ? (
          <button className="btn btn-danger" onClick={() => setConfirmClear(true)}>🗑️ Clear All</button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-danger" onClick={() => { clearAllTrades(); setConfirmClear(false) }}>Confirm Delete</button>
            <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* KPI tiles */}
      <div className="grid-5" style={{ marginBottom: '20px' }}>
        <StatTile label="Total P&L" value={`₹${fmtNum(totalPnL, 0)}`}
          color={totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
        <StatTile label="Win Rate" value={fmtPct(winRate)}
          color={winRate > 0.5 ? 'var(--accent-green)' : 'var(--accent-red)'} />
        <StatTile label="Profit Factor" value={profitFactor ? fmtNum(profitFactor, 2) : '—'}
          color={profitFactor > 1.5 ? 'var(--accent-green)' : 'var(--text-primary)'} />
        <StatTile label="Avg Risk" value={`₹${fmtNum(avgRisk, 0)}`} />
        <StatTile label="Discipline 🎯" value={fmtPct(discipline)}
          color={discipline > 0.8 ? 'var(--accent-green)' : discipline > 0.5 ? 'var(--accent-gold)' : 'var(--accent-red)'}
          sub={`${trades.filter(t => t.pre_trade_data_flag === 'Yes').length}/${trades.length} pre-planned`} />
      </div>

      {closedTrades.length > 0 && (
        <>
          {/* Equity Curve */}
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div className="section-title" style={{ marginBottom: '14px' }}>Equity Curve</div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityCurve} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#8899aa', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="var(--border-emphasis)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="cum" stroke="var(--accent-green)" strokeWidth={2}
                    dot={{ fill: 'var(--accent-green)', r: 3 }} name="Cumulative P&L"
                    style={{ filter: 'drop-shadow(0 0 4px var(--accent-green))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-trade P&L bars */}
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div className="section-title" style={{ marginBottom: '14px' }}>Trade P&L</div>
            <div style={{ height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equityCurve} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#8899aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="var(--border-emphasis)" />
                  <Bar dataKey="pnl" name="P&L" radius={[3, 3, 0, 0]}>
                    {equityCurve.map((e, i) => (
                      <Cell key={i} fill={e.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Trade table */}
      <div className="card" style={{ padding: '20px' }}>
        <div className="section-title" style={{ marginBottom: '14px' }}>All Trades</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Edge</th>
                <th>Instrument</th>
                <th>Entry</th>
                <th>SL</th>
                <th>Exit</th>
                <th>P&L</th>
                <th>Pre-Planned</th>
                <th>Exit Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allTrades.map(t => {
                const pnl = calcPnL(t)
                return (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{t.trade_date}</td>
                    <td><span className="badge badge-blue">{t.edge_type?.split(' ')[0]}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{t.instrument}</td>
                    <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{fmtNum(t.entry_price)}</td>
                    <td style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>{fmtNum(t.stop_loss)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{t.exit_price ? fmtNum(t.exit_price) : '—'}</td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: pnl == null ? 'var(--text-muted)' : pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {pnl != null ? `₹${fmtNum(pnl, 0)}` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${t.pre_trade_data_flag === 'Yes' ? 'badge-green' : 'badge-red'}`}>
                        {t.pre_trade_data_flag}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{t.exit_reason || '—'}</td>
                    <td>
                      <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => deleteTrade(t.id)}>✕</button>
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
