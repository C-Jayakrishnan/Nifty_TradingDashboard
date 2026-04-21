import { useState, useCallback } from 'react'
import { useTrades } from '../hooks/useData'
import { fmtNum } from '../utils/calculations'
import { SectionHeading } from '../components/Charts'
import {
  TrendingUp, TrendingDown, Minus, Shield,
  CheckCircle, BookOpen, Save, AlertCircle, Activity, Zap
} from 'lucide-react'

// ── All constants and sub-components defined OUTSIDE the main component ──────
// This is critical — defining ChipRow inside the component causes React to
// remount it on every render, which destroys input focus.

const EDGE_TYPES   = ['Structural Game', 'Level Game', 'Gap Game']
const DIRECTIONS   = ['Going Up', 'Falling Down', 'Sideways']
const EXIT_REASONS = ['SL hit', 'Target hit', 'Manual exit', 'Time exit']
const INSTRUMENTS  = ['Call Option', 'Put Option']

const DIR_META = {
  'Going Up':     { Icon: TrendingUp,   sel: 'selected-green' },
  'Falling Down': { Icon: TrendingDown, sel: 'selected-red'   },
  'Sideways':     { Icon: Minus,        sel: 'selected-amber' },
}

const BOOL_META = {
  Yes: { sel: 'selected-green' },
  No:  { sel: 'selected-red'  },
}

const INSTR_META = {
  'Call Option': { sel: 'selected-green' },
  'Put Option':  { sel: 'selected-red'   },
}

// ChipRow is a pure presentational component — no state, defined at module level
function ChipRow({ label, options, value, onChange, meta }) {
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const selected = value === opt
          const m = meta?.[opt]
          const Icon = m?.Icon
          const selClass = selected ? (m?.sel || 'selected') : ''
          return (
            <button
              key={opt}
              type="button"
              className={`chip ${selClass}`}
              onClick={() => onChange(opt)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
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

// Numeric input with label — defined at module level to prevent remounting
function NumInput({ label, value, onChange, step = '0.05', min, placeholder = '0.00', borderColor }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        step={step}
        min={min}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ textAlign: 'right', fontSize: 15, fontWeight: 600, borderColor }}
      />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TradeLoggingPage() {
  const { addTrade } = useTrades()
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const [edgeType,    setEdgeType]    = useState('Level Game')
  const [direction,   setDirection]   = useState('Going Up')
  const [harmony,     setHarmony]     = useState('Yes')
  const [preTrade,    setPreTrade]    = useState('Yes')
  const [instrument,  setInstrument]  = useState('Call Option')
  const [exitReason,  setExitReason]  = useState('Target hit')
  const [tradeDate,   setTradeDate]   = useState(new Date().toISOString().slice(0, 10))

  // Numeric fields — kept as strings so input stays controlled without fighting browser number formatting
  const [entryPrice, setEntryPrice] = useState('')
  const [stopLoss,   setStopLoss]   = useState('')
  const [numLots,    setNumLots]    = useState('1')
  const [qtyPerLot,  setQtyPerLot]  = useState('75')
  const [exitPrice,  setExitPrice]  = useState('')
  const [charges,    setCharges]    = useState('')

  const risk =
    entryPrice && stopLoss
      ? Math.abs(+entryPrice - +stopLoss) * +qtyPerLot * +numLots
      : 0

  const canSubmit = !!entryPrice && !!stopLoss

  const onSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    await addTrade({
      edge_type:           edgeType,
      market_direction:    direction,
      harmony,
      entry_price:         +entryPrice,
      stop_loss:           +stopLoss,
      num_lots:            +numLots,
      qty_per_lot:         +qtyPerLot,
      instrument,
      pre_trade_data_flag: preTrade,
      exit_price:          exitPrice  ? +exitPrice  : null,
      charges:             charges    ? +charges    : null,
      exit_reason:         exitReason,
      trade_date:          tradeDate,
      risk_amount:         risk,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 4000)
    // Only clear price fields, keep preferences
    setEntryPrice('')
    setStopLoss('')
    setExitPrice('')
    setCharges('')
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(0,229,255,0.15),rgba(0,229,255,0.04))',
          border: '1px solid rgba(0,229,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0,229,255,0.08)',
        }}>
          <BookOpen size={20} color="var(--cyan)" strokeWidth={1.8} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '0.1em', lineHeight: 1.1 }}>
            TRADE JOURNAL
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 3, letterSpacing: '0.04em' }}>
            Discipline tracking &amp; performance analysis
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Context card ── */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <SectionHeading icon={Activity}>Trade Context</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ChipRow label="Edge Type"         options={EDGE_TYPES}  value={edgeType}   onChange={setEdgeType}   />
            <ChipRow label="Market Direction"  options={DIRECTIONS}  value={direction}  onChange={setDirection}  meta={DIR_META} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <ChipRow label="In Harmony with Capital?" options={['Yes','No']} value={harmony}   onChange={setHarmony}   meta={BOOL_META} />
              <ChipRow label="Data entered before trade?" options={['Yes','No']} value={preTrade} onChange={setPreTrade}  meta={BOOL_META} />
            </div>
          </div>
        </div>

        {/* ── Entry card ── */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <SectionHeading icon={Zap}>Entry Details</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <NumInput
                label="Entry Price" value={entryPrice}
                onChange={e => setEntryPrice(e.target.value)}
                borderColor="rgba(0,229,255,0.25)"
              />
              <NumInput
                label="Stop Loss" value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                borderColor={stopLoss ? 'rgba(255,61,107,0.35)' : undefined}
              />
              <NumInput
                label="Lots" value={numLots}
                onChange={e => setNumLots(e.target.value)}
                step="1" min="1" placeholder="1"
              />
              <NumInput
                label="Qty / Lot" value={qtyPerLot}
                onChange={e => setQtyPerLot(e.target.value)}
                step="1" min="1" placeholder="75"
              />
            </div>

            <ChipRow label="Instrument" options={INSTRUMENTS} value={instrument} onChange={setInstrument} meta={INSTR_META} />

            {/* Risk pill */}
            {risk > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,61,107,0.06)', border: '1px solid rgba(255,61,107,0.18)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={14} color="var(--red)" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
                    Risk Amount
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--red)', textShadow: '0 0 12px rgba(255,61,107,0.4)' }}>
                  ₹{fmtNum(risk, 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Exit card ── */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <SectionHeading
            icon={AlertCircle}
            action={<span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>optional</span>}
          >
            Exit Details
          </SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NumInput
              label="Exit Price" value={exitPrice}
              onChange={e => setExitPrice(e.target.value)}
              placeholder="Blank if open"
            />
            <NumInput
              label="Charges (₹)" value={charges}
              onChange={e => setCharges(e.target.value)}
              step="1" placeholder="0"
            />
            <div className="form-group">
              <label className="label">Exit Reason</label>
              <select className="input" value={exitReason} onChange={e => setExitReason(e.target.value)}>
                {EXIT_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Trade Date</label>
              <input
                className="input" type="date"
                value={tradeDate} onChange={e => setTradeDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Success alert */}
        {saved && (
          <div className="alert alert-success fade-in" style={{ alignItems: 'center' }}>
            <CheckCircle size={14} /> Trade saved and synced to all devices!
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={onSubmit}
          disabled={saving || !canSubmit}
          style={{
            width: '100%', padding: '15px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: canSubmit
              ? 'linear-gradient(90deg,rgba(0,229,255,0.18),rgba(0,212,180,0.12))'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${canSubmit ? 'rgba(0,229,255,0.35)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            color: canSubmit ? 'var(--cyan)' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all var(--transition)',
            boxShadow: canSubmit ? 'var(--cyan-glow)' : 'none',
          }}
        >
          {saving
            ? <span className="spinner" style={{ width: 16, height: 16 }} />
            : <><Save size={15} strokeWidth={2.5} /> Save Trade</>
          }
        </button>

        {!canSubmit && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            Entry price and stop loss are required
          </p>
        )}

      </div>
    </div>
  )
}
