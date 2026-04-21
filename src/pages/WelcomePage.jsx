import { useState, useEffect } from 'react'
import { computeEdgeResults, getRelevantScenarios, computeLevelScenarioStats } from '../utils/calculations'
import { useSessionCache } from '../hooks/useData'
import { Gauge, DonutChart, CPRDisplay, ScenarioAccordion, SignalBadge, ProbRow, SectionHeading, InsightPanel } from '../components/Charts'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calculator, Target, Zap, BarChart2, Activity, Info, TrendingUp, TrendingDown } from 'lucide-react'

export default function WelcomePage({ stats }) {
  const { cache, saveCache } = useSessionCache()
  const [inputs, setInputs] = useState({
    prevOpen:  cache.prevOpen  || '',
    prevHigh:  cache.prevHigh  || '',
    prevLow:   cache.prevLow   || '',
    prevClose: cache.prevClose || '',
    todayOpen: cache.todayOpen || '',
    testDate:  cache.testDate  || new Date().toISOString().slice(0, 10),
  })
  const [results, setResults]           = useState(null)
  const [levelScenarios, setLevelScenarios] = useState([])

  const set = k => e => setInputs(prev => ({ ...prev, [k]: e.target.value }))

  const compute = () => {
    const nums = {
      prevOpen: +inputs.prevOpen, prevHigh: +inputs.prevHigh,
      prevLow:  +inputs.prevLow,  prevClose: +inputs.prevClose,
      todayOpen: +inputs.todayOpen,
    }
    if (!nums.prevHigh || !nums.prevLow || !nums.prevClose) return
    const er = computeEdgeResults(nums, stats, stats?.thresholds)
    setResults(er)
    saveCache({ ...inputs, ...nums })
    if (stats?.level_game_stats) setLevelScenarios(computeLevelScenarioStats(stats.level_game_stats))
  }

  useEffect(() => {
    if (cache.prevHigh && cache.prevLow && cache.prevClose && stats) compute()
  }, [stats]) // eslint-disable-line

  const candleRow = results && stats?.candle_state_stats?.find(r => r.candle_state === results.candleState)
  const openRow   = results && stats?.open_context_stats?.find(r => r.open_context === results.openContext)
  const gapRow    = results && stats?.gap_stats?.find(r =>
    r.gap_direction === results.gap.direction && r.gap_bucket === results.gap.bucket)

  let signal = null, signalData = null
  if (candleRow && openRow) {
    const bull  = (+candleRow.prob_trend_up   + +openRow.prob_trend_up)   / 2
    const bear  = (+candleRow.prob_trend_down + +openRow.prob_trend_down) / 2
    signal     = bull > bear + 0.05 ? 'BULLISH' : bear > bull + 0.05 ? 'BEARISH' : 'NEUTRAL'
    signalData = { bull, bear, chop: (bull + bear) < 1 ? 1 - bull - bear : 0, gapFill: gapRow ? +gapRow.prob_fill_100pct : null }
  }

  const relScenarioNames = results ? getRelevantScenarios(results.pos, results.cprPos) : []
  const relScenarios     = levelScenarios.filter(s => relScenarioNames.includes(s.scenario))
  const scenarioGroups   = {}
  relScenarios.forEach(r => {
    if (!scenarioGroups[r.scenario]) scenarioGroups[r.scenario] = []
    scenarioGroups[r.scenario].push(r)
  })

  const gapChartData = gapRow ? [
    { name:'50%',  value: +(+gapRow.prob_fill_50pct  * 100).toFixed(1), color:'var(--text-muted)' },
    { name:'80%',  value: +(+gapRow.prob_fill_80pct  * 100).toFixed(1), color:'var(--amber)'      },
    { name:'100%', value: +(+gapRow.prob_fill_100pct * 100).toFixed(1), color:'var(--cyan)'       },
  ] : []

  const signalBorderColor = signal === 'BULLISH' ? 'rgba(57,255,133,0.25)' : signal === 'BEARISH' ? 'rgba(255,61,107,0.25)' : 'rgba(255,182,39,0.2)'

  return (
    <div>
      {!stats && (
        <div className="alert alert-warning" style={{ marginBottom:20, alignItems:'center' }}>
          <Info size={14} /> No backtest data — go to <strong style={{ marginLeft:4 }}>Dev</strong> tab to upload stats CSVs.
        </div>
      )}

      {/* ── Two-column layout on desktop ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        {/* LEFT: Market Snapshot inputs */}
        <div className="card" style={{ padding:'20px 22px', position:'relative' }}>
          <div className="hud-corner tl" /><div className="hud-corner tr" />
          <div className="hud-corner bl" /><div className="hud-corner br" />
          <SectionHeading icon={Calculator}>Market Snapshot</SectionHeading>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            {[
              { label:'Prev Open',  k:'prevOpen'  },
              { label:'Prev High',  k:'prevHigh'  },
              { label:'Prev Low',   k:'prevLow'   },
              { label:'Prev Close', k:'prevClose' },
            ].map(({ label, k }) => (
              <div className="form-group" key={k}>
                <label className="label">{label}</label>
                <input className="input" type="number" step="0.05" placeholder="0.00"
                  value={inputs[k]} onChange={set(k)}
                  style={{ fontSize:15, fontWeight:600, textAlign:'right' }} />
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            <div className="form-group">
              <label className="label">Today's Open</label>
              <input className="input" type="number" step="0.05" placeholder="0.00"
                value={inputs.todayOpen} onChange={set('todayOpen')}
                style={{ fontSize:15, fontWeight:600, textAlign:'right', borderColor:'rgba(0,229,255,0.2)' }} />
            </div>
            <div className="form-group">
              <label className="label">Date</label>
              <input className="input" type="date" value={inputs.testDate} onChange={set('testDate')} />
            </div>
          </div>

          {/* Gap display */}
          {results?.gap?.direction && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)' }}>
              <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em' }}>TODAY'S GAP</span>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span className={`badge ${results.gap.direction === 'Gap_Up' ? 'badge-green' : results.gap.direction === 'Gap_Down' ? 'badge-red' : 'badge-muted'}`}>
                  {results.gap.direction.replace(/_/g,' ')}
                </span>
                <span style={{ fontSize:13, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-primary)' }}>
                  {results.gap.sizePct?.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          <button className="btn-neon" onClick={compute}
            disabled={!inputs.prevHigh || !inputs.prevLow || !inputs.prevClose}>
            <Calculator size={15} strokeWidth={2.5} />
            COMPUTE EDGES
          </button>
        </div>

        {/* RIGHT: Trade Bias Engine / Signal Hero */}
        <div className="card" style={{
          padding:'20px 22px', position:'relative',
          borderColor: results && signal ? signalBorderColor : 'var(--border-subtle)',
          boxShadow: results && signal ? `0 0 32px ${signalBorderColor}` : 'none',
        }}>
          <SectionHeading icon={Zap}>Trade Bias Engine</SectionHeading>
          {results && signal && signalData ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
              {/* Big confidence gauge */}
              <div style={{ position:'relative', textAlign:'center' }}>
                <Gauge
                  value={Math.abs(signalData.bull - signalData.bear)}
                  label="EDGE CONFIDENCE"
                  color={signal === 'BULLISH' ? 'var(--green)' : signal === 'BEARISH' ? 'var(--red)' : 'var(--amber)'}
                  size={160}
                />
                <div style={{ marginTop:8 }}>
                  <SignalBadge signal={signal} />
                </div>
              </div>
              <div className="neon-rule" style={{ width:'100%', margin:'4px 0' }} />
              <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
                <ProbRow label="Trend Up"    value={signalData.bull} color="var(--green)" />
                <ProbRow label="Trend Down"  value={signalData.bear} color="var(--red)"   />
                {signalData.gapFill != null && (
                  <ProbRow label="Gap Fill 100%" value={signalData.gapFill} color="var(--cyan)" />
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'40px 0', opacity:0.4 }}>
              <Zap size={36} color="var(--cyan)" strokeWidth={1.5} style={{ filter:'drop-shadow(0 0 8px var(--cyan))' }} />
              <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textAlign:'center' }}>
                ENTER OHLC DATA<br />TO COMPUTE EDGE
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ── CPR Levels ── */}
      {results && (
        <div className="card fade-in" style={{ padding:'20px 22px', marginTop:14 }}>
          <SectionHeading icon={BarChart2}>CPR Levels</SectionHeading>
          <CPRDisplay pp={results.pp} tc={results.tc} bc={results.bc} />
          {(results.pos || results.cprPos) && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}>
              {[results.pos, results.cprPos].filter(Boolean).map(t => (
                <span key={t} className="badge badge-muted" style={{ fontSize:10 }}>{t.replace(/_/g,' ')}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Candle Game + Level Game side by side ── */}
      {results && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>

          {/* Candle Game */}
          <div className="card fade-in" style={{ padding:'20px 22px' }}>
            <SectionHeading icon={Activity}>Candle Game</SectionHeading>
            <div style={{ marginBottom:14 }}>
              {results.candleState?.split('|').map((p, i) => (
                <span key={i} className={i === 0 ? 'badge badge-gold' : 'badge badge-muted'}
                  style={{ fontSize:10, marginRight:4 }}>
                  {p.replace(/_/g,' ')}
                </span>
              ))}
            </div>
            {candleRow ? (
              <>
                <div style={{ display:'flex', justifyContent:'center', padding:'8px 0' }}>
                  <DonutChart
                    up={+candleRow.prob_trend_up}
                    chop={+candleRow.prob_range_chop}
                    down={+candleRow.prob_trend_down}
                    size={150}
                  />
                </div>
                <div style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', marginTop:8, letterSpacing:'0.06em' }}>
                  SAMPLE: {candleRow.total_count} DAYS · AVG RANGE: {(+candleRow.avg_next_day_range_pct * 100).toFixed(1)}%
                </div>
              </>
            ) : (
              <div className="alert alert-warning" style={{ fontSize:11 }}><Info size={12} /> No match in historical data</div>
            )}
          </div>

          {/* Level Game */}
          <div className="card fade-in" style={{ padding:'20px 22px', overflowY:'auto', maxHeight:380 }}>
            <SectionHeading icon={Target}>Level Game</SectionHeading>
            {Object.keys(scenarioGroups).length > 0
              ? Object.entries(scenarioGroups).map(([name, outcomes]) => (
                  <ScenarioAccordion key={name} scenario={name} outcomes={outcomes} />
                ))
              : <div className="alert alert-info" style={{ fontSize:11 }}><Info size={12} /> No scenarios match current context</div>
            }
          </div>

        </div>
      )}

      {/* ── Gap Analysis ── */}
      {results && gapRow && (
        <div className="card fade-in" style={{ padding:'20px 22px', marginTop:14 }}>
          <SectionHeading icon={BarChart2}>Gap Analysis</SectionHeading>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <span className={`badge ${results.gap?.direction === 'Gap_Up' ? 'badge-green' : results.gap?.direction === 'Gap_Down' ? 'badge-red' : 'badge-muted'}`}>
              {results.gap?.direction?.replace(/_/g,' ')}
            </span>
            <span className="badge badge-blue">{results.gap?.bucket}</span>
            <span className="badge badge-muted">{results.gap?.size?.toFixed(1)} pts</span>
            <span className="badge badge-muted">{gapRow.total_count} days sample</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ height:160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gapChartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11, fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} domain={[0,100]} />
                  <Tooltip contentStyle={{ background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:10, fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text-primary)' }}
                    formatter={v => [`${v}%`,'Fill Prob']} />
                  <Bar dataKey="value" radius={[5,5,0,0]}>
                    {gapChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, justifyContent:'center' }}>
              <ProbRow label="50% Fill" value={+gapRow.prob_fill_50pct}  color="var(--text-secondary)" />
              <ProbRow label="80% Fill" value={+gapRow.prob_fill_80pct}  color="var(--amber)" />
              <ProbRow label="100% Fill" value={+gapRow.prob_fill_100pct} color="var(--cyan)"  />
            </div>
          </div>
        </div>
      )}

      {/* ── AI Insight Engine ── */}
      {results && signal && (
        <div style={{ marginTop:14 }}>
          <InsightPanel signal={signal} candleState={results.candleState} openContext={results.openContext} gap={results.gap} />
        </div>
      )}

    </div>
  )
}
