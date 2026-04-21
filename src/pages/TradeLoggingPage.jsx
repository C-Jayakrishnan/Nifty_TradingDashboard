import { useState } from 'react'
import { useTrades } from '../hooks/useData'
import { fmtNum } from '../utils/calculations'
import { SectionHeading } from '../components/Charts'
import { TrendingUp, TrendingDown, Minus, Shield, CheckCircle, BookOpen, Save, AlertCircle, Activity, Zap } from 'lucide-react'

const EDGE_TYPES   = ['Structural Game', 'Level Game', 'Gap Game']
const DIRECTIONS   = ['Going Up', 'Falling Down', 'Sideways']
const EXIT_REASONS = ['SL hit', 'Target hit', 'Manual exit', 'Time exit']
const INSTRUMENTS  = ['Call Option', 'Put Option']

const DIR_META = {
  'Going Up':     { Icon: TrendingUp,   color:'var(--green)',  sel:'selected-green' },
  'Falling Down': { Icon: TrendingDown, color:'var(--red)',    sel:'selected-red'   },
  'Sideways':     { Icon: Minus,        color:'var(--amber)',  sel:'selected-amber' },
}
const EDGE_COLORS = { 'Structural Game':'cyan', 'Level Game':'cyan', 'Gap Game':'cyan' }

export default function TradeLoggingPage() {
  const { addTrade } = useTrades()
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [form, setForm] = useState({
    edge_type:'Level Game', market_direction:'Going Up', harmony:'Yes',
    entry_price:'', stop_loss:'', num_lots:1, qty_per_lot:75,
    instrument:'Call Option', pre_trade:'Yes',
    exit_price:'', charges:'', exit_reason:'Target hit',
    trade_date: new Date().toISOString().slice(0,10),
  })

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setV = (k,v) => setForm(p => ({ ...p, [k]: v }))

  const risk = form.entry_price && form.stop_loss
    ? Math.abs(+form.entry_price - +form.stop_loss) * +form.qty_per_lot * +form.num_lots : 0

  const onSubmit = async () => {
    if (!form.entry_price || !form.stop_loss) return
    setSaving(true)
    await addTrade({
      edge_type:form.edge_type, market_direction:form.market_direction, harmony:form.harmony,
      entry_price:+form.entry_price, stop_loss:+form.stop_loss,
      num_lots:+form.num_lots, qty_per_lot:+form.qty_per_lot,
      instrument:form.instrument, pre_trade_data_flag:form.pre_trade,
      exit_price:form.exit_price ? +form.exit_price : null,
      charges:form.charges ? +form.charges : null,
      exit_reason:form.exit_reason, trade_date:form.trade_date, risk_amount:risk,
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 4000)
    setForm(p => ({ ...p, entry_price:'', stop_loss:'', exit_price:'', charges:'' }))
  }

  const canSubmit = !!form.entry_price && !!form.stop_loss

  const ChipRow = ({ label, options, field, meta }) => (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {options.map(opt => {
          const selected = form[field] === opt
          const m = meta?.[opt]
          const Icon = m?.Icon
          const selClass = selected ? (m?.sel || 'selected') : ''
          return (
            <button key={opt} type="button"
              className={`chip ${selClass}`}
              onClick={() => setV(field, opt)}
              style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              {Icon && <Icon size={12} strokeWidth={2} />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth:600 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
        <div style={{
          width:42, height:42, borderRadius:11, flexShrink:0,
          background:'linear-gradient(135deg,rgba(0,229,255,0.15),rgba(0,229,255,0.04))',
          border:'1px solid rgba(0,229,255,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 20px rgba(0,229,255,0.08)',
        }}>
          <BookOpen size={20} color="var(--cyan)" strokeWidth={1.8} />
        </div>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, letterSpacing:'0.1em', lineHeight:1.1 }}>TRADE JOURNAL</h1>
          <p style={{ color:'var(--text-muted)', fontSize:11, fontFamily:'var(--font-mono)', marginTop:3, letterSpacing:'0.04em' }}>Discipline tracking & performance analysis</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

        {/* Context card */}
        <div className="card" style={{ padding:'20px 22px' }}>
          <SectionHeading icon={Activity}>Trade Context</SectionHeading>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <ChipRow label="Edge Type" options={EDGE_TYPES} field="edge_type" />
            <ChipRow label="Market Direction" options={DIRECTIONS} field="market_direction" meta={DIR_META} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <ChipRow label="In Harmony with Capital?" options={['Yes','No']} field="harmony"
                meta={{ Yes:{ sel:'selected-green' }, No:{ sel:'selected-red' } }} />
              <ChipRow label="Data entered before trade?" options={['Yes','No']} field="pre_trade"
                meta={{ Yes:{ sel:'selected-green' }, No:{ sel:'selected-red' } }} />
            </div>
          </div>
        </div>

        {/* Entry card */}
        <div className="card" style={{ padding:'20px 22px' }}>
          <SectionHeading icon={Zap}>Entry Details</SectionHeading>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="label">Entry Price</label>
                <input className="input" type="number" step="0.05" placeholder="0.00"
                  value={form.entry_price} onChange={set('entry_price')}
                  style={{ textAlign:'right', fontSize:15, fontWeight:600, borderColor:'rgba(0,229,255,0.2)' }} />
              </div>
              <div className="form-group">
                <label className="label">Stop Loss</label>
                <input className="input" type="number" step="0.05" placeholder="0.00"
                  value={form.stop_loss} onChange={set('stop_loss')}
                  style={{ textAlign:'right', fontSize:15, fontWeight:600, borderColor: form.stop_loss ? 'rgba(255,61,107,0.3)' : undefined }} />
              </div>
              <div className="form-group">
                <label className="label">Lots</label>
                <input className="input" type="number" min="1" step="1"
                  value={form.num_lots} onChange={set('num_lots')} style={{ textAlign:'right' }} />
              </div>
              <div className="form-group">
                <label className="label">Qty / Lot</label>
                <input className="input" type="number" min="1" step="1"
                  value={form.qty_per_lot} onChange={set('qty_per_lot')} style={{ textAlign:'right' }} />
              </div>
            </div>

            <ChipRow label="Instrument" options={INSTRUMENTS} field="instrument"
              meta={{ 'Call Option':{ sel:'selected-green' }, 'Put Option':{ sel:'selected-red' } }} />

            {/* Risk display */}
            {risk > 0 && (
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background:'rgba(255,61,107,0.06)', border:'1px solid rgba(255,61,107,0.18)',
                borderRadius:'var(--radius-md)', padding:'12px 16px',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Shield size={14} color="var(--red)" />
                  <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--font-mono)' }}>
                    Risk Amount
                  </span>
                </div>
                <span style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--red)', textShadow:'0 0 12px rgba(255,61,107,0.4)' }}>
                  ₹{fmtNum(risk,0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Exit card */}
        <div className="card" style={{ padding:'20px 22px' }}>
          <SectionHeading icon={AlertCircle}
            action={<span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontStyle:'italic' }}>optional</span>}>
            Exit Details
          </SectionHeading>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="label">Exit Price</label>
              <input className="input" type="number" step="0.05" placeholder="Blank if open"
                value={form.exit_price} onChange={set('exit_price')} style={{ textAlign:'right' }} />
            </div>
            <div className="form-group">
              <label className="label">Charges (₹)</label>
              <input className="input" type="number" step="1" placeholder="0"
                value={form.charges} onChange={set('charges')} style={{ textAlign:'right' }} />
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
        </div>

        {/* Success */}
        {saved && (
          <div className="alert alert-success fade-in" style={{ alignItems:'center' }}>
            <CheckCircle size={14} /> Trade saved and synced to all devices!
          </div>
        )}

        {/* Submit */}
        <button onClick={onSubmit} disabled={saving || !canSubmit} style={{
          width:'100%', padding:'15px 20px',
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          background: canSubmit
            ? 'linear-gradient(90deg,rgba(0,229,255,0.18),rgba(0,212,180,0.12))'
            : 'rgba(255,255,255,0.03)',
          border: `1px solid ${canSubmit ? 'rgba(0,229,255,0.35)' : 'var(--border-subtle)'}`,
          borderRadius:'var(--radius-md)',
          color: canSubmit ? 'var(--cyan)' : 'var(--text-muted)',
          fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700,
          letterSpacing:'0.1em', textTransform:'uppercase',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition:'all var(--transition)',
          boxShadow: canSubmit ? 'var(--cyan-glow)' : 'none',
        }}>
          {saving
            ? <span className="spinner" style={{ width:16, height:16 }} />
            : <><Save size={15} strokeWidth={2.5} /> Save Trade</>
          }
        </button>

        {!canSubmit && (
          <p style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>
            Entry price and stop loss are required
          </p>
        )}
      </div>
    </div>
  )
}
