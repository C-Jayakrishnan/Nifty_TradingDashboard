import { useState } from 'react'
import { useTrades } from '../hooks/useData'
import { fmtNum } from '../utils/calculations'

const EDGE_TYPES = ['Structural Game', 'Level Game', 'Gap Game']
const DIRECTIONS = ['Going Up', 'Falling Down', 'Sideways']
const EXIT_REASONS = ['SL hit', 'Target hit', 'Manual exit', 'Time exit']

export default function TradeLoggingPage() {
  const { addTrade } = useTrades()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    edge_type: 'Level Game',
    market_direction: 'Going Up',
    harmony: 'Yes',
    entry_price: '',
    stop_loss: '',
    num_lots: 1,
    qty_per_lot: 75,
    instrument: 'Call Option',
    pre_trade: 'Yes',
    exit_price: '',
    charges: '',
    exit_reason: 'Target hit',
    trade_date: new Date().toISOString().slice(0, 10),
  })

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setRadio = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const risk = form.entry_price && form.stop_loss
    ? Math.abs(+form.entry_price - +form.stop_loss) * +form.qty_per_lot * +form.num_lots
    : 0

  const onSubmit = async () => {
    if (!form.entry_price || !form.stop_loss) return
    setSaving(true)
    await addTrade({
      edge_type: form.edge_type,
      market_direction: form.market_direction,
      harmony: form.harmony,
      entry_price: +form.entry_price,
      stop_loss: +form.stop_loss,
      num_lots: +form.num_lots,
      qty_per_lot: +form.qty_per_lot,
      instrument: form.instrument,
      pre_trade_data_flag: form.pre_trade,
      exit_price: form.exit_price ? +form.exit_price : null,
      charges: form.charges ? +form.charges : null,
      exit_reason: form.exit_reason,
      trade_date: form.trade_date,
      risk_amount: risk,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    // Reset optional fields
    setForm(p => ({ ...p, entry_price: '', stop_loss: '', exit_price: '', charges: '' }))
  }

  const RadioGroup = ({ label, key: k, options }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <div className="radio-group">
        {options.map(opt => (
          <button key={opt} className={`radio-option ${form[k] === opt ? 'selected' : ''}`}
            onClick={() => setRadio(k, opt)} type="button">
            {opt}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
          📝 Log Trade
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Record trades for discipline tracking and performance analysis
        </p>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Context */}
        <div className="section-title">Trade Context</div>
        <RadioGroup label="Edge Type" key="edge_type" options={EDGE_TYPES} />
        <RadioGroup label="Market Direction" key="market_direction" options={DIRECTIONS} />
        <RadioGroup label="In Harmony with Capital?" key="harmony" options={['Yes', 'No']} />
        <RadioGroup label="Data entered before trade?" key="pre_trade" options={['Yes', 'No']} />

        <div className="divider" />

        {/* Entry */}
        <div className="section-title">Entry Details</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="label">Entry Price</label>
            <input className="input" type="number" step="0.05" placeholder="0.00"
              value={form.entry_price} onChange={set('entry_price')} />
          </div>
          <div className="form-group">
            <label className="label">Stop Loss</label>
            <input className="input" type="number" step="0.05" placeholder="0.00"
              value={form.stop_loss} onChange={set('stop_loss')} />
          </div>
          <div className="form-group">
            <label className="label">Lots</label>
            <input className="input" type="number" min="1" step="1"
              value={form.num_lots} onChange={set('num_lots')} />
          </div>
          <div className="form-group">
            <label className="label">Qty / Lot</label>
            <input className="input" type="number" min="1" step="1"
              value={form.qty_per_lot} onChange={set('qty_per_lot')} />
          </div>
        </div>
        <RadioGroup label="Instrument" key="instrument" options={['Call Option', 'Put Option']} />

        {/* Risk display */}
        {risk > 0 && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk Amount</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--accent-red)' }}>
              ₹{fmtNum(risk, 0)}
            </span>
          </div>
        )}

        <div className="divider" />

        {/* Exit (optional) */}
        <div className="section-title">Exit (optional)</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="label">Exit Price</label>
            <input className="input" type="number" step="0.05" placeholder="Leave blank if open"
              value={form.exit_price} onChange={set('exit_price')} />
          </div>
          <div className="form-group">
            <label className="label">Charges (₹)</label>
            <input className="input" type="number" step="1" placeholder="0"
              value={form.charges} onChange={set('charges')} />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Exit Reason</label>
          <select className="input" value={form.exit_reason} onChange={set('exit_reason')}>
            {EXIT_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Trade Date</label>
          <input className="input" type="date" value={form.trade_date} onChange={set('trade_date')} />
        </div>

        <div className="divider" />

        {saved && <div className="alert alert-success fade-in">✅ Trade saved successfully!</div>}

        <button className="btn btn-primary" onClick={onSubmit} disabled={saving || !form.entry_price || !form.stop_loss}
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px' }}>
          {saving ? <span className="spinner" /> : '💾 Save Trade'}
        </button>
      </div>
    </div>
  )
}
