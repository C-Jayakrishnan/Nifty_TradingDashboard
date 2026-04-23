import { useMemo, useState } from 'react'
import { useTrades } from '../hooks/useData'
import { calcPnL, fmtNum, fmtPct } from '../utils/calculations'
import { SectionHeading } from '../components/Charts'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Area, AreaChart } from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Trash2,
  Activity,
  BarChart2,
  Shield,
  CheckCircle,
  XCircle,
  Minus,
  Pencil,
  Save,
  X,
  Sparkles,
} from 'lucide-react'

const EDGE_TYPES = ['Structural Game', 'Level Game', 'Gap Game']
const DIRECTIONS = ['Going Up', 'Falling Down', 'Sideways']
const EXIT_REASONS = ['SL hit', 'Target hit', 'Manual exit', 'Time exit']
const INSTRUMENTS = ['Call Option', 'Put Option']

function KpiCard({ label, value, sub, color, Icon }) {
  return (
    <div
      className="card"
      style={{
        padding: '16px 18px',
        minHeight: 126,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
        {Icon && <Icon size={14} color={color || 'var(--text-muted)'} strokeWidth={1.8} style={{ opacity: 0.8 }} />}
      </div>
      <div className="number-pop" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1.05 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,21,32,0.96)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: 11, backdropFilter: 'blur(8px)' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.06em' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.value >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
          {p.name}: Rs.{fmtNum(Math.abs(p.value), 0)} {p.value >= 0 ? 'up' : 'down'}
        </div>
      ))}
    </div>
  )
}

function EditTradeModal({ trade, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    edge_type: trade.edge_type || 'Level Game',
    market_direction: trade.market_direction || 'Going Up',
    instrument: trade.instrument || 'Call Option',
    entry_price: trade.entry_price ?? '',
    stop_loss: trade.stop_loss ?? '',
    num_lots: trade.num_lots ?? 1,
    qty_per_lot: trade.qty_per_lot ?? 75,
    exit_price: trade.exit_price ?? '',
    charges: trade.charges ?? '',
    exit_reason: trade.exit_reason || 'Target hit',
    trade_date: trade.trade_date || new Date().toISOString().slice(0, 10),
    harmony: trade.harmony || 'Yes',
    pre_trade_data_flag: trade.pre_trade_data_flag || 'Yes',
  })

  const riskAmount = useMemo(() => {
    if (!form.entry_price || !form.stop_loss) return 0
    return Math.abs(Number(form.entry_price) - Number(form.stop_loss)) * Number(form.qty_per_lot || 0) * Number(form.num_lots || 0)
  }, [form.entry_price, form.stop_loss, form.qty_per_lot, form.num_lots])

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const submit = () => {
    onSave({
      ...form,
      entry_price: Number(form.entry_price),
      stop_loss: Number(form.stop_loss),
      num_lots: Number(form.num_lots),
      qty_per_lot: Number(form.qty_per_lot),
      exit_price: form.exit_price === '' ? null : Number(form.exit_price),
      charges: form.charges === '' ? null : Number(form.charges),
      risk_amount: riskAmount,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.08em' }}>Edit Saved Trade</div>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Update journal details without deleting the record</div>
          </div>
          <button className="btn btn-ghost" style={{ padding: '8px 10px' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px 22px', display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Edge Type</label>
              <select className="input" value={form.edge_type} onChange={e => setField('edge_type', e.target.value)}>
                {EDGE_TYPES.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Market Direction</label>
              <select className="input" value={form.market_direction} onChange={e => setField('market_direction', e.target.value)}>
                {DIRECTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Instrument</label>
              <select className="input" value={form.instrument} onChange={e => setField('instrument', e.target.value)}>
                {INSTRUMENTS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Trade Date</label>
              <input className="input" type="date" value={form.trade_date} onChange={e => setField('trade_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Entry Price</label>
              <input className="input" type="number" step="0.05" value={form.entry_price} onChange={e => setField('entry_price', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Stop Loss</label>
              <input className="input" type="number" step="0.05" value={form.stop_loss} onChange={e => setField('stop_loss', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Lots</label>
              <input className="input" type="number" min="1" value={form.num_lots} onChange={e => setField('num_lots', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Qty / Lot</label>
              <input className="input" type="number" min="1" value={form.qty_per_lot} onChange={e => setField('qty_per_lot', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Exit Price</label>
              <input className="input" type="number" step="0.05" value={form.exit_price} onChange={e => setField('exit_price', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Charges</label>
              <input className="input" type="number" step="1" value={form.charges} onChange={e => setField('charges', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Exit Reason</label>
              <select className="input" value={form.exit_reason} onChange={e => setField('exit_reason', e.target.value)}>
                {EXIT_REASONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="label">Harmony</label>
                <select className="input" value={form.harmony} onChange={e => setField('harmony', e.target.value)}>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Pre-planned</label>
                <select className="input" value={form.pre_trade_data_flag} onChange={e => setField('pre_trade_data_flag', e.target.value)}>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 18, border: '1px solid rgba(0,229,255,0.12)', background: 'rgba(0,229,255,0.04)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              Recomputed Risk
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--cyan)' }}>
              Rs.{fmtNum(riskAmount, 0)}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 22px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving || !form.entry_price || !form.stop_loss}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InsightPage() {
  const { trades, clearAllTrades, deleteTrade, updateTrade, loading } = useTrades()
  const [confirmClear, setConfirmClear] = useState(false)
  const [editingTrade, setEditingTrade] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const closedTrades = trades
    .filter(t => t.exit_price != null)
    .map(t => ({ ...t, pnl: calcPnL(t) }))
    .sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))

  const allTrades = [...trades].sort((a, b) => new Date(b.trade_date) - new Date(a.trade_date))

  const totalPnL = closedTrades.reduce((s, t) => s + t.pnl, 0)
  const winners = closedTrades.filter(t => t.pnl > 0)
  const losers = closedTrades.filter(t => t.pnl < 0)
  const winRate = closedTrades.length ? winners.length / closedTrades.length : 0
  const grossProfit = winners.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null
  const avgWin = winners.length ? grossProfit / winners.length : 0
  const avgLoss = losers.length ? grossLoss / losers.length : 0
  const avgRisk = trades.reduce((s, t) => s + (+t.risk_amount || 0), 0) / Math.max(trades.length, 1)
  const discipline = trades.length ? trades.filter(t => t.pre_trade_data_flag === 'Yes').length / trades.length : 0

  let cum = 0
  const equityCurve = closedTrades.map(t => {
    cum += t.pnl
    return { date: t.trade_date?.slice(5), cum: +cum.toFixed(2), pnl: +t.pnl.toFixed(2) }
  })

  const bestStreak = useMemo(() => {
    let current = 0
    let best = 0
    closedTrades.forEach(t => {
      if (t.pnl > 0) {
        current += 1
        best = Math.max(best, current)
      } else {
        current = 0
      }
    })
    return best
  }, [closedTrades])

  const pnlColor = totalPnL >= 0 ? 'var(--green)' : 'var(--red)'
  const winColor = winRate > 0.55 ? 'var(--green)' : winRate < 0.4 ? 'var(--red)' : 'var(--amber)'
  const pfColor = !profitFactor ? 'var(--text-muted)' : profitFactor > 1.5 ? 'var(--green)' : profitFactor < 1 ? 'var(--red)' : 'var(--amber)'
  const discColor = discipline > 0.8 ? 'var(--green)' : discipline > 0.5 ? 'var(--amber)' : 'var(--red)'

  const handleSaveEdit = async updates => {
    if (!editingTrade) return
    setSavingEdit(true)
    const { error } = await updateTrade(editingTrade.id, updates)
    setSavingEdit(false)
    if (!error) setEditingTrade(null)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 60, justifyContent: 'center' }}>
        <span className="spinner" />
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em' }}>LOADING TRADES...</span>
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div style={{ maxWidth: 640, paddingTop: 50 }}>
        <div className="card" style={{ padding: '30px 28px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <BarChart2 size={28} color="var(--cyan)" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.1em', marginBottom: 10 }}>NO TRADES YET</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
            Log your first trade in the Journal tab to unlock analytics, streaks, and editable saved insights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span className="badge badge-purple"><Sparkles size={12} /> Insight Engine</span>
              <span className="badge badge-blue">Editable Journal</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 10 }}>
              TRADE INSIGHTS
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 720 }}>
              A premium command view of performance, discipline, and expectancy. Saved trades can now be edited directly from this tab without deleting the record.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              <span className="badge badge-muted">{trades.length} logged</span>
              <span className="badge badge-muted">{closedTrades.length} closed</span>
              <span className="badge badge-green">{winners.length} winners</span>
              <span className="badge badge-red">{losers.length} losers</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Net P&L
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: pnlColor }}>
                Rs.{fmtNum(totalPnL, 0)}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Best Win Streak
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--cyan)' }}>
                {bestStreak}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
          Use the edit action in the trade table to revise saved details and keep the analytics in sync.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {confirmClear ? (
            <>
              <button className="btn btn-danger" style={{ fontSize: 11 }} onClick={() => { clearAllTrades(); setConfirmClear(false) }}>
                <Trash2 size={12} /> Confirm
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => setConfirmClear(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-ghost" style={{ fontSize: 11, color: 'var(--red)', borderColor: 'rgba(255,61,107,0.2)' }} onClick={() => setConfirmClear(true)}>
              <Trash2 size={12} /> Clear All
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        <KpiCard label="Total P&L" value={`Rs.${fmtNum(totalPnL, 0)}`} color={pnlColor} Icon={totalPnL >= 0 ? TrendingUp : TrendingDown} />
        <KpiCard label="Win Rate" value={fmtPct(winRate)} color={winColor} Icon={Target} />
        <KpiCard label="Profit Factor" value={profitFactor ? fmtNum(profitFactor, 2) : '—'} color={pfColor} Icon={BarChart2} />
        <KpiCard label="Avg Risk" value={`Rs.${fmtNum(avgRisk, 0)}`} color="var(--amber)" Icon={Shield} />
        <KpiCard label="Discipline" value={fmtPct(discipline)} color={discColor} Icon={Activity} sub={`${trades.filter(t => t.pre_trade_data_flag === 'Yes').length}/${trades.length} pre-planned`} />
        <KpiCard label="Avg Win" value={`Rs.${fmtNum(avgWin, 0)}`} color="var(--green)" />
        <KpiCard label="Avg Loss" value={`Rs.${fmtNum(avgLoss, 0)}`} color="var(--red)" />
      </div>

      {closedTrades.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
          <div className="card" style={{ padding: '18px 20px' }}>
            <SectionHeading icon={TrendingUp}>Equity Curve</SectionHeading>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="cum" stroke="var(--teal)" strokeWidth={2.2} fill="url(#eqGrad)" name="Cumulative P&L" dot={false} activeDot={{ r: 4, fill: 'var(--cyan)', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px' }}>
            <SectionHeading icon={BarChart2}>Trade P&L</SectionHeading>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equityCurve} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />
                  <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                    {equityCurve.map((e, i) => (
                      <Cell key={i} fill={e.pnl >= 0 ? 'var(--green)' : 'var(--red)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '18px 20px' }}>
        <SectionHeading icon={Activity}>All Trades</SectionHeading>
        <div className="table-wrap" style={{ borderRadius: 'var(--radius-lg)' }}>
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
                <th>P&amp;L</th>
                <th>Pre-planned</th>
                <th>Exit Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allTrades.map(t => {
                const pnl = calcPnL(t)
                const pnlTone = pnl == null ? 'var(--text-muted)' : pnl >= 0 ? 'var(--green)' : 'var(--red)'
                return (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{t.trade_date}</td>
                    <td><span className="badge badge-blue" style={{ fontSize: 9 }}>{t.edge_type?.split(' ')[0]}</span></td>
                    <td>
                      {t.market_direction === 'Going Up'
                        ? <TrendingUp size={13} color="var(--green)" />
                        : t.market_direction === 'Falling Down'
                        ? <TrendingDown size={13} color="var(--red)" />
                        : <Minus size={13} color="var(--amber)" />
                      }
                    </td>
                    <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{t.instrument}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)' }}>{fmtNum(t.entry_price)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)' }}>{fmtNum(t.stop_loss)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.exit_price ? fmtNum(t.exit_price) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: pnlTone }}>
                      {pnl != null ? `Rs.${fmtNum(pnl, 0)}` : '—'}
                    </td>
                    <td>
                      {t.pre_trade_data_flag === 'Yes'
                        ? <CheckCircle size={13} color="var(--green)" style={{ filter: 'drop-shadow(0 0 4px var(--green))' }} />
                        : <XCircle size={13} color="var(--red)" />
                      }
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.exit_reason || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => setEditingTrade(t)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all var(--transition)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--cyan)'; e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                          title="Edit trade"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => deleteTrade(t.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all var(--transition)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,61,107,0.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                          title="Delete trade"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          saving={savingEdit}
          onClose={() => !savingEdit && setEditingTrade(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}
