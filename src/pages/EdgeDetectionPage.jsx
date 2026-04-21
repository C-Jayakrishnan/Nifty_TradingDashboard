import { useState, useMemo } from 'react'
import { ProbRow, DonutChart, SectionHeading } from '../components/Charts'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Search, Activity, BarChart2, TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp } from 'lucide-react'

const TABS = [
  { id:'candle', label:'Candle States', Icon: Activity },
  { id:'open',   label:'Open Context',  Icon: TrendingUp },
  { id:'gap',    label:'Gap Analysis',  Icon: BarChart2 },
]

// Expandable candle card
function CandleCard({ row }) {
  const [open, setOpen] = useState(false)
  const base = row.candle_state.split('|')[0]
  const tags = row.candle_state.split('|').slice(1)
  const dominant = +row.prob_trend_up > +row.prob_trend_down ? 'bull' : +row.prob_trend_down > +row.prob_trend_up ? 'bear' : 'chop'
  const domColor = dominant === 'bull' ? 'var(--green)' : dominant === 'bear' ? 'var(--red)' : 'var(--amber)'

  return (
    <div className="card" style={{
      overflow:'hidden',
      borderColor: open ? 'var(--border-default)' : 'var(--border-subtle)',
      boxShadow: open ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', gap:14,
        padding:'16px 20px', background:'none', border:'none', cursor:'pointer',
        transition:'background var(--transition)',
      }}>
        {/* Dominant color dot */}
        <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:domColor, boxShadow:`0 0 8px ${domColor}` }} />

        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--text-primary)', letterSpacing:'0.06em', marginBottom:4 }}>
            {base.replace(/_/g,' ')}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {tags.map(t => <span key={t} className="badge badge-muted" style={{ fontSize:9 }}>{t.replace(/_/g,' ')}</span>)}
          </div>
        </div>

        {/* Mini stats preview */}
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', marginBottom:2 }}>SAMPLE</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{row.total_count}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { v:+row.prob_trend_up,   c:'var(--green)', l:'▲' },
              { v:+row.prob_range_chop, c:'var(--amber)', l:'—' },
              { v:+row.prob_trend_down, c:'var(--red)',   l:'▼' },
            ].map(({v,c,l}) => (
              <div key={l} style={{ textAlign:'center', minWidth:32 }}>
                <div style={{ fontSize:12, fontWeight:700, fontFamily:'var(--font-display)', color:c, textShadow:`0 0 8px ${c}88` }}>
                  {Math.round(v*100)}%
                </div>
                <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{l}</div>
              </div>
            ))}
          </div>
          {open
            ? <ChevronUp size={14} color="var(--text-muted)" />
            : <ChevronDown size={14} color="var(--text-muted)" />
          }
        </div>
      </button>

      {open && (
        <div className="fade-in" style={{ padding:'4px 20px 20px', borderTop:'1px solid var(--border-subtle)' }}>
          <div style={{ display:'flex', justifyContent:'center', padding:'16px 0' }}>
            <DonutChart up={+row.prob_trend_up} chop={+row.prob_range_chop} down={+row.prob_trend_down} size={140} />
          </div>
          <div style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>
            AVG NEXT DAY RANGE: {(+row.avg_next_day_range_pct * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  )
}

// Open context card
function OpenCard({ row }) {
  const [open, setOpen] = useState(false)
  const parts = row.open_context.split('|')
  const partColor = p => p.includes('Above')||p.includes('PDH') ? 'badge-green' : p.includes('Below')||p.includes('PDL') ? 'badge-red' : p.includes('CPR')||p.includes('Inside') ? 'badge-blue' : 'badge-muted'
  const topProb = Math.max(+row.prob_trend_up, +row.prob_trend_down, +row.prob_range_chop)
  const topColor = topProb === +row.prob_trend_up ? 'var(--green)' : topProb === +row.prob_trend_down ? 'var(--red)' : 'var(--amber)'

  return (
    <div className="card" style={{ overflow:'hidden', borderColor: open ? 'var(--border-default)' : 'var(--border-subtle)' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        padding:'14px 18px', background:'none', border:'none', cursor:'pointer',
      }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:topColor, boxShadow:`0 0 6px ${topColor}`, flexShrink:0 }} />
        <div style={{ flex:1, display:'flex', gap:5, flexWrap:'wrap', textAlign:'left' }}>
          {parts.map(p => <span key={p} className={`badge ${partColor(p)}`} style={{ fontSize:9 }}>{p.replace(/_/g,' ')}</span>)}
        </div>
        <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', background:'rgba(255,255,255,0.03)', padding:'2px 8px', borderRadius:100, border:'1px solid var(--border-subtle)', flexShrink:0 }}>
          {row.total_count}d
        </span>
        {open ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
      </button>

      {open && (
        <div className="fade-in" style={{ padding:'0 18px 16px', borderTop:'1px solid var(--border-subtle)' }}>
          <div style={{ paddingTop:14, display:'flex', flexDirection:'column', gap:8 }}>
            <ProbRow label="Trend Up Day"   value={+row.prob_trend_up}    color="var(--green)" />
            <ProbRow label="Range/Chop Day" value={+row.prob_range_chop}  color="var(--amber)" />
            <ProbRow label="Trend Down Day" value={+row.prob_trend_down}  color="var(--red)"   />
          </div>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(0,229,255,0.1),transparent)', margin:'12px 0' }} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <ProbRow label="PDH Break ✓" value={+row.prob_pdh_break_success} color="var(--green)" />
            <ProbRow label="PDL Break ✓" value={+row.prob_pdl_break_success} color="var(--red)"   />
            <ProbRow label="False PDH"   value={+row.prob_false_pdh_break}   color="var(--amber)" />
            <ProbRow label="False PDL"   value={+row.prob_false_pdl_break}   color="var(--amber)" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function EdgeDetectionPage({ stats }) {
  const [activeTab, setActiveTab] = useState('candle')
  const [filter, setFilter]       = useState('')
  const [gapDir, setGapDir]       = useState('')

  const noStats = !stats

  const filteredCandle = useMemo(() =>
    (stats?.candle_state_stats || [])
      .filter(r => !filter || r.candle_state.toLowerCase().includes(filter.toLowerCase()))
      .sort((a,b) => b.total_count - a.total_count)
  , [stats, filter])

  const filteredOpen = useMemo(() =>
    (stats?.open_context_stats || [])
      .filter(r => !filter || r.open_context.toLowerCase().includes(filter.toLowerCase()))
      .sort((a,b) => b.total_count - a.total_count)
  , [stats, filter])

  const filteredGap = useMemo(() =>
    (stats?.gap_stats || [])
      .filter(r => !gapDir || r.gap_direction === gapDir)
      .sort((a,b) => b.total_count - a.total_count)
  , [stats, gapDir])

  const tooltipStyle = { background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:10, fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-primary)' }

  return (
    <div style={{ maxWidth:880 }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, letterSpacing:'0.1em', color:'var(--text-primary)', marginBottom:6 }}>
          STATISTICAL BROWSER
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize:12, fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>
          {noStats ? 'Upload stats in the Dev tab to explore historical probabilities'
            : `${stats.candle_state_stats?.length} candle states · ${stats.open_context_stats?.length} open contexts · ${stats.gap_stats?.length} gap buckets`}
        </p>
      </div>

      {noStats && (
        <div className="alert alert-warning" style={{ marginBottom:20 }}>
          <Info size={14} /> No stats loaded — go to <strong style={{ marginLeft:4 }}>Dev</strong> tab to upload backtest CSV files.
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom:20 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => { setActiveTab(id); setFilter('') }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <Icon size={12} strokeWidth={2} />{label}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== 'gap' && (
        <div style={{ position:'relative', marginBottom:16 }}>
          <Search size={13} color="var(--text-muted)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
          <input className="input" placeholder={activeTab === 'candle' ? 'Filter candle states…' : 'Filter open contexts…'}
            value={filter} onChange={e => setFilter(e.target.value)}
            style={{ paddingLeft:34, fontSize:12 }} />
        </div>
      )}

      {/* Candle Tab */}
      {activeTab === 'candle' && (
        <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filteredCandle.length === 0
            ? <div className="alert alert-info"><Info size={13} /> No matching candle states</div>
            : filteredCandle.map(row => <CandleCard key={row.candle_state} row={row} />)
          }
        </div>
      )}

      {/* Open Context Tab */}
      {activeTab === 'open' && (
        <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filteredOpen.length === 0
            ? <div className="alert alert-info"><Info size={13} /> No matching open contexts</div>
            : filteredOpen.map(row => <OpenCard key={row.open_context} row={row} />)
          }
        </div>
      )}

      {/* Gap Tab */}
      {activeTab === 'gap' && (
        <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Direction filter chips */}
          <div style={{ display:'flex', gap:8, marginBottom:4 }}>
            {[{v:'',label:'All'},{v:'Gap_Up',label:'Gap Up'},{v:'Gap_Down',label:'Gap Down'}].map(({v,label}) => (
              <button key={v} onClick={() => setGapDir(v)}
                className={`chip ${gapDir === v ? (v === 'Gap_Up' ? 'selected-green' : v === 'Gap_Down' ? 'selected-red' : 'selected') : ''}`}>
                {v === 'Gap_Up' && <TrendingUp size={11} strokeWidth={2} />}
                {v === 'Gap_Down' && <TrendingDown size={11} strokeWidth={2} />}
                {label}
              </button>
            ))}
          </div>

          {filteredGap.map(row => {
            const chartData = [
              { name:'50%',  value:+(+row.prob_fill_50pct  * 100).toFixed(1), color:'var(--text-muted)' },
              { name:'80%',  value:+(+row.prob_fill_80pct  * 100).toFixed(1), color:'var(--amber)'      },
              { name:'100%', value:+(+row.prob_fill_100pct * 100).toFixed(1), color:'var(--cyan)'       },
            ]
            const isUp = row.gap_direction === 'Gap_Up'
            return (
              <div key={`${row.gap_direction}_${row.gap_bucket}`} className="card" style={{ padding:'18px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span className={`badge ${isUp ? 'badge-green' : 'badge-red'}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {row.gap_direction?.replace('_',' ')}
                    </span>
                    <span className="badge badge-blue">{row.gap_bucket}</span>
                  </div>
                  <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.06em' }}>
                    {row.total_count} DAYS · AVG {(+row.avg_gap_size_pct * 100).toFixed(2)}% GAP
                  </span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div style={{ height:140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top:0, right:0, left:-25, bottom:0 }}>
                        <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11, fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} domain={[0,100]} />
                        <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'Fill Prob']} />
                        <Bar dataKey="value" radius={[5,5,0,0]}>
                          {chartData.map((d,i) => <Cell key={i} fill={d.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10, justifyContent:'center' }}>
                    <ProbRow label="50% Fill"  value={+row.prob_fill_50pct}  color="var(--text-secondary)" />
                    <ProbRow label="80% Fill"  value={+row.prob_fill_80pct}  color="var(--amber)" />
                    <ProbRow label="100% Fill" value={+row.prob_fill_100pct} color="var(--cyan)"  />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
