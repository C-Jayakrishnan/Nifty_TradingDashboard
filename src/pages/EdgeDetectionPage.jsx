import { Search, Filter, TrendingUp, TrendingDown, Activity, BarChart2, Info } from 'lucide-react'
import { useState, useMemo } from 'react'
import { ProbRow, Gauge } from '../components/Charts'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CANDLE_STATES = [
  'Strong_Acceptance', 'Exhaustion_Rejection', 'Expansion', 'Compression', 'Balanced_Neutral'
]

export default function EdgeDetectionPage({ stats }) {
  const [activeTab, setActiveTab] = useState('candle')
  const [candleFilter, setCandleFilter] = useState('')
  const [openFilter, setOpenFilter] = useState('')
  const [gapDir, setGapDir] = useState('')

  if (!stats) {
    return (
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '20px' }}>
          📊 Edge Detection
        </h1>
        <div className="alert alert-warning">
          No backtest stats available. Upload raw NIFTY data in the <strong>Developer</strong> tab to generate statistics.
        </div>
      </div>
    )
  }

  const { candle_state_stats = [], open_context_stats = [], gap_stats = [] } = stats

  const filteredCandle = useMemo(() =>
    candle_state_stats.filter(r =>
      !candleFilter || r.candle_state.toLowerCase().includes(candleFilter.toLowerCase())
    ).sort((a, b) => b.total_count - a.total_count)
  , [candle_state_stats, candleFilter])

  const filteredOpen = useMemo(() =>
    open_context_stats.filter(r =>
      !openFilter || r.open_context.toLowerCase().includes(openFilter.toLowerCase())
    ).sort((a, b) => b.total_count - a.total_count)
  , [open_context_stats, openFilter])

  const filteredGap = useMemo(() =>
    gap_stats.filter(r => !gapDir || r.gap_direction === gapDir)
      .sort((a, b) => b.total_count - a.total_count)
  , [gap_stats, gapDir])

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
          Edge Detection Browser
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Browse all historical probabilities by candle state, open context, and gap type
        </p>
      </div>

      <div className="tab-bar" style={{ marginBottom: '20px' }}>
        {['candle', 'open', 'gap'].map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>
            {t === 'candle' ? 'Candle' : t === 'open' ? 'Open Context' : 'Gap Game'}
          </button>
        ))}
      </div>

      {/* ── Candle State Tab ── */}
      {activeTab === 'candle' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input className="input" placeholder="Filter candle states..." value={candleFilter}
            onChange={e => setCandleFilter(e.target.value)} />
          {filteredCandle.map(row => (
            <div key={row.candle_state} className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                    {row.candle_state.split('|')[0]}
                  </div>
                  {row.candle_state.includes('|') && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {row.candle_state.split('|').slice(1).map(tag => (
                        <span key={tag} className="badge badge-muted">{tag.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stat-label">Sample</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>
                    {row.total_count}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <Gauge value={+row.prob_trend_up} label="Up" color="var(--accent-green)" size={80} />
                <Gauge value={+row.prob_range_chop} label="Chop" color="var(--accent-gold)" size={80} />
                <Gauge value={+row.prob_trend_down} label="Down" color="var(--accent-red)" size={80} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Avg next day range: {(+row.avg_next_day_range_pct * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Open Context Tab ── */}
      {activeTab === 'open' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input className="input" placeholder="Filter open contexts..." value={openFilter}
            onChange={e => setOpenFilter(e.target.value)} />
          {filteredOpen.map(row => (
            <div key={row.open_context} className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                  {row.open_context.split('|').map(part => (
                    <span key={part} className={`badge ${
                      part.includes('Above') || part.includes('Up') ? 'badge-green'
                      : part.includes('Below') ? 'badge-red'
                      : part.includes('CPR') ? 'badge-blue'
                      : 'badge-muted'}`}>
                      {part.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <span className="badge badge-muted">{row.total_count} days</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ProbRow label="Trend Up Day" value={+row.prob_trend_up} color="var(--accent-green)" />
                <ProbRow label="Range/Chop Day" value={+row.prob_range_chop} color="var(--accent-gold)" />
                <ProbRow label="Trend Down Day" value={+row.prob_trend_down} color="var(--accent-red)" />
                <div className="divider" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <ProbRow label="PDH Break Success" value={+row.prob_pdh_break_success} color="var(--accent-green)" />
                  <ProbRow label="PDL Break Success" value={+row.prob_pdl_break_success} color="var(--accent-red)" />
                  <ProbRow label="False PDH Break" value={+row.prob_false_pdh_break} color="var(--accent-gold)" />
                  <ProbRow label="False PDL Break" value={+row.prob_false_pdl_break} color="var(--accent-gold)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Gap Tab ── */}
      {activeTab === 'gap' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="radio-group" style={{ marginBottom: '4px' }}>
            {['', 'Gap_Up', 'Gap_Down'].map(d => (
              <button key={d} className={`radio-option ${gapDir === d ? 'selected' : ''}`}
                onClick={() => setGapDir(d)}>
                {d === '' ? 'All' : d.replace('_', ' ')}
              </button>
            ))}
          </div>
          {filteredGap.map(row => {
            const chartData = [
              { name: '50%', value: +(+row.prob_fill_50pct * 100).toFixed(1) },
              { name: '80%', value: +(+row.prob_fill_80pct * 100).toFixed(1) },
              { name: '100%', value: +(+row.prob_fill_100pct * 100).toFixed(1) },
            ]
            return (
              <div key={`${row.gap_direction}_${row.gap_bucket}`} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge ${row.gap_direction === 'Gap_Up' ? 'badge-green' : 'badge-red'}`}>
                      {row.gap_direction?.replace('_', ' ')}
                    </span>
                    <span className="badge badge-blue">{row.gap_bucket}</span>
                  </div>
                  <span className="badge badge-muted">{row.total_count} days</span>
                </div>
                <div style={{ height: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fill: '#8899aa', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                        formatter={v => [`${v}%`, 'Fill Prob']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        <Cell fill="#4a5a6a" /><Cell fill="#f39c12" /><Cell fill="#00d084" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
