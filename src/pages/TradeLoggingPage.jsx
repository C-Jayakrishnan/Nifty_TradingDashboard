import { useState } from 'react'
import { useTrades } from '../hooks/useData'
import { fmtNum } from '../utils/calculations'
import { ChipGroup, SectionHeading } from '../components/Charts'
import { TrendingUp, TrendingDown, Minus, ShieldAlert, CheckCircle2, BookOpen, Save, AlertCircle, Activity } from 'lucide-react'

const EDGE_TYPES   = ['Structural Game', 'Level Game', 'Gap Game']
const DIRECTIONS   = ['Going Up', 'Falling Down', 'Sideways']
const EXIT_REASONS = ['SL hit', 'Target hit', 'Manual exit', 'Time exit']
const INSTRUMENTS  = ['Call Option', 'Put Option']
const DIR_ICONS    = [TrendingUp, TrendingDown, Minus]

export default function TradeLoggingPage() {
  const { addTrade } = useTrades()
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [form, setForm] = useState({
    edge_type: 'Level Game', market_direction: 'Going Up', harmony: 'Yes',
    entry_price: '', stop_loss: '', num_lots: 1, qty_per_lot: 75,
    instrument: 'Call Option', pre_trade: 'Yes',
    exit_price: '', charges: '', exit_reason: 'Target hit',
    trade_date: new Date().toISOString().slice(0, 10),
  })

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setV = (k, v)  => setForm(p => ({ ...p, [k]: v }))

  const risk = form.entry_price && form.stop_loss
    ? Math.abs(+form.entry_price - +form.stop_loss) * +form.qty_per_lot * +form.num_lots : 0

  const onSubmit = async () => {
    if (!form.entry_price || !form.stop_loss) return
    setSaving(true)
    await addTrade({
      edge_type: form.edge_type, market_direction: form.market_direction, harmony: form.harmony,
      entry_price: +form.entry_price, stop_loss: +form.stop_loss,
      num_lots: +form.num_lots, qty_per_lot: +form.qty_per_lot,
      instrument: form.instrument, pre_trade_data_flag: form.pre_trade,
      exit_price: form.exit_price ? +form.exit_price : null,
      charges: form.charges ? +form.charges : null,
      exit_reason: form.exit_reason, trade_date: form.trade_date, risk_amount: risk,
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 4000)
    setForm(p => ({ ...p, entry_price: '', stop_loss: '', exit_price: '', charges: '' }))
  }

  const canSubmit = !!form.entry_price && !!form.stop_loss

  const Card = ({ children, style }) => (
    <div className="card page-panel" style={{ padding: '20px 22px', ...style }}>{children}</div>
  )

  return (
    <div className="page-shell" style={{ maxWidth: '620px' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-eyebrow">Trade Logging</div>
          <h1 className="page-title">Log New Trades</h1>
          <p className="page-intro">Capture trade details instantly and keep your performance journal aligned with your edge workflow.</p>
        </div>
        <div className="page-meta" style={{ alignItems: 'flex-end' }}>
          <div className="page-pill">Discipline-first logging</div>
        </div>
      </div>
        <div style={{
          width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(0,208,132,0.18),rgba(0,208,132,0.04))',
          border: '1px solid rgba(0,208,132,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={20} color="var(--accent-green)" strokeWidth={1.8} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, lineHeight: 1.1 }}>Log Trade</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>Discipline tracking and performance analysis</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Context card */}
        <Card>
          <SectionHeading icon={Activity}>Trade Context</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ChipGroup label="Edge Type" options={EDGE_TYPES} value={form.edge_type} onChange={v => setV('edge_type', v)} />
            <ChipGroup label="Market Direction" options={DIRECTIONS} value={form.market_direction} onChange={v => setV('market_direction', v)} icons={DIR_ICONS} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ChipGroup label="In Harmony with Capital?" options={['Yes', 'No']} value={form.harmony} onChange={v => setV('harmony', v)} />
              <ChipGroup label="Data entered before trade?" options={['Yes', 'No']} value={form.pre_trade} onChange={v => setV('pre_trade', v)} />
            </div>
          </div>
        </Card>

        {/* Entry card */}
        <Card>
          <SectionHeading icon={TrendingUp}>Entry Details</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Entry Price', key: 'entry_price', style: {} },
                { label: 'Stop Loss',   key: 'stop_loss',   style: { borderColor: form.stop_loss ? 'rgba(255,71,87,0.5)' : undefined } },
                { label: 'Lots',        key: 'num_lots',    style: {}, min: 1, step: 1 },
                { label: 'Qty / Lot',   key: 'qty_per_lot', style: {}, min: 1, step: 1 },
              ].map(({ label, key, style, min, step }) => (
                <div className="form-group" key={key}>
                  <label className="label">{label}</label>
                  <input className="input" type="number" step={step || '0.05'} min={min}
                    placeholder="0" value={form[key]} onChange={set(key)} style={style} />
                </div>
              ))}
            </div>
            <ChipGroup label="Instrument" options={INSTRUMENTS} value={form.instrument} onChange={v => setV('instrument', v)} />
            {risk > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,71,87,0.07)', border: '1px solid rgba(255,71,87,0.18)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={15} color="var(--accent-red)" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk Amount</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--accent-red)' }}>
                  ₹{fmtNum(risk, 0)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Exit card */}
        <Card>
          <SectionHeading icon={AlertCircle} action={<span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>optional</span>}>
            Exit Details
          </SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Exit Price</label>
              <input className="input" type="number" step="0.05" placeholder="Blank if open"
                value={form.exit_price} onChange={set('exit_price')} />
            </div>
            <div className="form-group">
              <label className="label">Charges (₹)</label>
              <input className="input" type="number" step="1" placeholder="0"
                value={form.charges} onChange={set('charges')} />
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
          </div>
        </Card>

        {/* Success alert */}
        {saved && (
          <div className="alert alert-success fade-in" style={{ alignItems: 'center' }}>
            <CheckCircle2 size={16} /> Trade saved and synced!
          </div>
        )}

        {/* Submit */}
        <button onClick={onSubmit} disabled={saving || !canSubmit} style={{
          width: '100%', padding: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: canSubmit ? 'var(--accent-green)' : 'var(--bg-elevated)',
          border: 'none', borderRadius: 'var(--radius-md)',
          color: canSubmit ? 'var(--bg-void)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition)',
          boxShadow: canSubmit ? 'var(--accent-green-glow)' : 'none',
        }}>
          {saving ? <span className="spinner" style={{ width: '16px', height: '16px' }} />
            : <><Save size={16} strokeWidth={2.5} /> Save Trade</>}
        </button>
        {!canSubmit && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Entry price and stop loss are required
          </p>
        )}

      </div>
    </div>
  )
}
