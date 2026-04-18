import { useState, useEffect } from 'react'
import { computeEdgeResults, getRelevantScenarios, computeLevelScenarioStats } from '../utils/calculations'
import { useSessionCache } from '../hooks/useData'
import { Gauge, CPRDisplay, ScenarioAccordion, SignalBadge, ProbRow, SectionHeading } from '../components/Charts'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calculator, TrendingUp, TrendingDown, Activity, Target, Zap, BarChart2, Info } from 'lucide-react'

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
  const [results, setResults]             = useState(null)
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
    if (stats?.level_game_stats) {
      setLevelScenarios(computeLevelScenarioStats(stats.level_game_stats))
    }
  }

  useEffect(() => {
    if (cache.prevHigh && cache.prevLow && cache.prevClose && stats) compute()
  }, [stats]) // eslint-disable-line

  const noStats   = !stats
  const candleRow = results && stats?.candle_state_stats?.find(r => r.candle_state === results.candleState)
  const openRow   = results && stats?.open_context_stats?.find(r => r.open_context === results.openContext)
  const gapRow    = results && stats?.gap_stats?.find(r =>
    r.gap_direction === results.gap.direction && r.gap_bucket === results.gap.bucket)

  let signal = null, signalData = null
  if (candleRow && openRow) {
    const cBull = +candleRow.prob_trend_up,  cBear = +candleRow.prob_trend_down
    const lBull = +openRow.prob_trend_up,    lBear = +openRow.prob_trend_down
    const bull  = (cBull + lBull) / 2,      bear  = (cBear + lBear) / 2
    signal     = bull > bear + 0.05 ? 'BULLISH' : bear > bull + 0.05 ? 'BEARISH' : 'NEUTRAL'
    signalData = { bull, bear, gapFill: gapRow ? +gapRow.prob_fill_100pct : null }
  }

  const relScenarioNames = results ? getRelevantScenarios(results.pos, results.cprPos) : []
  const relScenarios     = levelScenarios.filter(s => relScenarioNames.includes(s.scenario))
  const scenarioGroups   = {}
  relScenarios.forEach(r => {
    if (!scenarioGroups[r.scenario]) scenarioGroups[r.scenario] = []
    scenarioGroups[r.scenario].push(r)
  })

  const gapChartData = gapRow ? [
    { name: '50% Fill',  value: +(+gapRow.prob_fill_50pct  * 100).toFixed(1) },
    { name: '80% Fill',  value: +(+gapRow.prob_fill_80pct  * 100).toFixed(1) },
    { name: '100% Fill', value: +(+gapRow.prob_fill_100pct * 100).toFixed(1) },
  ] : []

  const inputFields = [
    { label: 'Prev Open',  key: 'prevOpen'  },
    { label: 'Prev High',  key: 'prevHigh'  },
    { label: 'Prev Low',   key: 'prevLow'   },
    { label: 'Prev Close', key: 'prevClose' },
  ]

  const signalColor = signal === 'BULLISH' ? 'var(--accent-green)'
    : signal === 'BEARISH' ? 'var(--accent-red)' : 'var(--accent-gold)'

  return (
    <div style={{ maxWidth: '860px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(0,208,132,0.18),rgba(0,208,132,0.04))',
          border: '1px solid rgba(0,208,132,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Target size={20} color="var(--accent-green)" strokeWidth={1.8} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, lineHeight: 1.1 }}>Edge Detection</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>Enter previous day OHLC + today's open to compute statistical edges</p>
        </div>
      </div>

      {noStats && (
        <div className="alert alert-warning" style={{ marginBottom: '20px', alignItems: 'center' }}>
          <Info size={15} />
          No backtest data — go to <strong style={{ marginLeft: '4px' }}>Developer</strong> tab to upload stats CSVs.
        </div>
      )}

      {/* Input card */}
      <div className="card" style={{ padding: '20px 22px', marginBottom: '16px' }}>
        <SectionHeading icon={Calculator}>Previous Day &amp; Today's Open</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
          {inputFields.map(({ label, key }) => (
            <div className="form-group" key={key}>
              <label className="label">{label}</label>
              <input className="input" type="number" step="0.05" placeholder="0.00"
                value={inputs[key]} onChange={set(key)} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="label">Today's Open</label>
            <input className="input" type="number" step="0.05" placeholder="0.00"
              value={inputs.todayOpen} onChange={set('todayOpen')} />
          </div>
          <div className="form-group">
            <label className="label">Date</label>
            <input className="input" type="date" value={inputs.testDate} onChange={set('testDate')} />
          </div>
        </div>
        <button
          onClick={compute}
          disabled={!inputs.prevHigh || !inputs.prevLow || !inputs.prevClose}
          style={{
            width: '100%', padding: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'var(--accent-green)', border: 'none', borderRadius: 'var(--radius-md)',
            color: 'var(--bg-void)', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', transition: 'all var(--transition)',
            boxShadow: 'var(--accent-green-glow)',
            opacity: (!inputs.prevHigh || !inputs.prevLow || !inputs.prevClose) ? 0.4 : 1,
          }}
        >
          <Calculator size={16} strokeWidth={2.5} />
          Compute Edges
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* CPR Levels */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <SectionHeading icon={BarChart2}>CPR Levels</SectionHeading>
            <CPRDisplay pp={results.pp} tc={results.tc} bc={results.bc} />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
              {[results.pos, results.cprPos].filter(Boolean).map(t => (
                <span key={t} className="badge badge-muted" style={{ fontSize: '11px' }}>
                  {t.replace(/_/g, ' ')}
                </span>
              ))}
              {results.gap?.direction && results.gap.direction !== 'No_Gap' && (
                <span className={`badge ${results.gap.direction === 'Gap_Up' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '11px' }}>
                  {results.gap.direction.replace(/_/g, ' ')} · {results.gap.sizePct?.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* Overall Signal */}
          {signal && (
            <div className="card" style={{
              padding: '20px 22px',
              borderColor: signalColor + '44',
              boxShadow: `0 0 24px ${signalColor}11`,
            }}>
              <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <SectionHeading icon={Zap}>Overall Signal</SectionHeading>
                  <SignalBadge signal={signal} />
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div className="stat-label">Edge Confidence</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: signalColor, lineHeight: 1 }}>
                    {Math.round(Math.abs(signalData.bull - signalData.bear) * 100)}%
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ProbRow label="Trend Up"    value={signalData.bull} color="var(--accent-green)" />
                <ProbRow label="Trend Down"  value={signalData.bear} color="var(--accent-red)"   />
                {signalData.gapFill != null && (
                  <ProbRow label="Gap Fill" value={signalData.gapFill} color="var(--accent-blue)" />
                )}
              </div>
              <div className={`alert alert-${signal === 'BULLISH' ? 'success' : signal === 'BEARISH' ? 'error' : 'warning'}`}
                style={{ marginTop: '14px', alignItems: 'center' }}>
                {signal === 'BULLISH' && <><TrendingUp size={14} /> Consider long entries with PDH breakout confirmation</>}
                {signal === 'BEARISH' && <><TrendingDown size={14} /> Consider short entries with PDL breakdown confirmation</>}
                {signal === 'NEUTRAL' && <><Activity size={14} /> Weak signal — wait for intraday confirmation</>}
              </div>
            </div>
          )}

          {/* Candle Game */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <SectionHeading icon={Activity}>Candle Game</SectionHeading>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>State: </span>
              {results.candleState?.split('|').map((part, i) => (
                <span key={i} className={`badge ${i === 0 ? 'badge-gold' : 'badge-muted'}`}
                  style={{ fontSize: '11px', marginLeft: '4px' }}>
                  {part.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            {candleRow ? (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: '16px',
                  padding: '16px 0', flexWrap: 'wrap',
                  background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                  marginBottom: '12px',
                }}>
                  <Gauge value={+candleRow.prob_trend_up}    label="Trend Up"   color="var(--accent-green)" size={110} />
                  <Gauge value={+candleRow.prob_range_chop}  label="Range/Chop" color="var(--accent-gold)"  size={110} />
                  <Gauge value={+candleRow.prob_trend_down}  label="Trend Down" color="var(--accent-red)"   size={110} />
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Sample: <strong style={{ color: 'var(--text-secondary)' }}>{candleRow.total_count}</strong> days ·
                  Avg next day range: <strong style={{ color: 'var(--text-secondary)' }}>{(+candleRow.avg_next_day_range_pct * 100).toFixed(1)}%</strong>
                </div>
              </>
            ) : (
              <div className="alert alert-warning"><Info size={14} /> No matching candle state in historical data.</div>
            )}
          </div>

          {/* Level Game */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <SectionHeading icon={Target}>Level Game</SectionHeading>
            {Object.keys(scenarioGroups).length > 0
              ? Object.entries(scenarioGroups).map(([name, outcomes]) => (
                  <ScenarioAccordion key={name} scenario={name} outcomes={outcomes} />
                ))
              : <div className="alert alert-info"><Info size={14} /> No level scenarios match today's open context.</div>
            }
          </div>

          {/* Gap Game */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <SectionHeading icon={BarChart2}>Gap Game</SectionHeading>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <span className={`badge ${results.gap?.direction === 'Gap_Up' ? 'badge-green' : results.gap?.direction === 'Gap_Down' ? 'badge-red' : 'badge-muted'}`}>
                {results.gap?.direction?.replace(/_/g, ' ')}
              </span>
              <span className="badge badge-blue">{results.gap?.bucket}</span>
              <span className="badge badge-muted">{results.gap?.size?.toFixed(1)} pts</span>
            </div>
            {gapRow ? (
              <div style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gapChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                      formatter={v => [`${v}%`, 'Probability']}
                    />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                      <Cell fill="var(--text-muted)" /><Cell fill="var(--accent-gold)" /><Cell fill="var(--accent-green)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="alert alert-info"><Info size={14} /> No gap data for this direction/bucket.</div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
