import { useState, useEffect } from 'react'
import { computeEdgeResults, getRelevantScenarios, computeLevelScenarioStats } from '../utils/calculations'
import { useSessionCache } from '../hooks/useData'
import { Gauge, CPRDisplay, ScenarioAccordion, SignalBadge, StatTile, ProbRow } from '../components/Charts'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function WelcomePage({ stats }) {
  const { cache, saveCache } = useSessionCache()
  const [inputs, setInputs] = useState({
    prevOpen: cache.prevOpen || '',
    prevHigh: cache.prevHigh || '',
    prevLow: cache.prevLow || '',
    prevClose: cache.prevClose || '',
    todayOpen: cache.todayOpen || '',
    testDate: cache.testDate || new Date().toISOString().slice(0, 10),
  })
  const [results, setResults] = useState(null)
  const [levelScenarios, setLevelScenarios] = useState([])

  const set = (k) => (e) => setInputs(prev => ({ ...prev, [k]: e.target.value }))

  const compute = () => {
    const nums = {
      prevOpen: +inputs.prevOpen,
      prevHigh: +inputs.prevHigh,
      prevLow: +inputs.prevLow,
      prevClose: +inputs.prevClose,
      todayOpen: +inputs.todayOpen,
    }
    if (!nums.prevHigh || !nums.prevLow || !nums.prevClose) return

    const er = computeEdgeResults(nums, stats, stats?.thresholds)
    setResults(er)
    saveCache({ ...inputs, ...nums })

    // Compute level scenarios
    if (stats?.level_game_stats) {
      const scenarios = computeLevelScenarioStats(stats.level_game_stats)
      setLevelScenarios(scenarios)
    }
  }

  // Auto-compute when inputs are restored from cache
  useEffect(() => {
    if (cache.prevHigh && cache.prevLow && cache.prevClose && stats) compute()
  }, [stats]) // eslint-disable-line

  const noStats = !stats

  // Candle game row
  const candleRow = results && stats?.candle_state_stats?.find(r => r.candle_state === results.candleState)
  // Open context row
  const openRow = results && stats?.open_context_stats?.find(r => r.open_context === results.openContext)
  // Gap row
  const gapRow = results && stats?.gap_stats?.find(r =>
    r.gap_direction === results.gap.direction && r.gap_bucket === results.gap.bucket)

  // Signal synthesis
  let signal = null, signalData = null
  if (candleRow && openRow) {
    const cBull = +candleRow.prob_trend_up, cBear = +candleRow.prob_trend_down
    const lBull = +openRow.prob_trend_up, lBear = +openRow.prob_trend_down
    const bull = (cBull + lBull) / 2, bear = (cBear + lBear) / 2
    signal = bull > bear + 0.05 ? 'BULLISH' : bear > bull + 0.05 ? 'BEARISH' : 'NEUTRAL'
    signalData = { bull, bear, gapFill: gapRow ? +gapRow.prob_fill_100pct : null }
  }

  // Level scenarios for this context
  const relScenarioNames = results ? getRelevantScenarios(results.pos, results.cprPos) : []
  const relScenarios = levelScenarios.filter(s => relScenarioNames.includes(s.scenario))

  // Group by scenario name
  const scenarioGroups = {}
  relScenarios.forEach(r => {
    if (!scenarioGroups[r.scenario]) scenarioGroups[r.scenario] = []
    scenarioGroups[r.scenario].push(r)
  })

  // Gap chart data
  const gapChartData = gapRow ? [
    { name: '50% Fill', value: +(gapRow.prob_fill_50pct * 100).toFixed(1) },
    { name: '80% Fill', value: +(gapRow.prob_fill_80pct * 100).toFixed(1) },
    { name: '100% Fill', value: +(gapRow.prob_fill_100pct * 100).toFixed(1) },
  ] : []

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
          🎯 Edge Detection
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Enter previous day OHLC and today's open to compute statistical edges
        </p>
      </div>

      {noStats && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          ⚠️ No backtest data loaded. Go to <strong>Developer</strong> tab to upload and run backtest, or upload stats CSVs.
        </div>
      )}

      {/* Inputs */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div className="section-title" style={{ marginBottom: '16px' }}>Previous Day & Today</div>
        <div className="grid-2" style={{ marginBottom: '14px' }}>
          {[
            { label: 'Prev Open', key: 'prevOpen' },
            { label: 'Prev High', key: 'prevHigh' },
            { label: 'Prev Low', key: 'prevLow' },
            { label: 'Prev Close', key: 'prevClose' },
          ].map(({ label, key }) => (
            <div className="form-group" key={key}>
              <label className="label">{label}</label>
              <input className="input" type="number" step="0.05" placeholder="0.00"
                value={inputs[key]} onChange={set(key)} />
            </div>
          ))}
        </div>
        <div className="grid-2" style={{ marginBottom: '16px' }}>
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
        <button className="btn btn-primary" onClick={compute}
          disabled={!inputs.prevHigh || !inputs.prevLow || !inputs.prevClose}
          style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
          Compute Edges →
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* CPR Levels */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="section-title" style={{ marginBottom: '14px' }}>CPR Levels</div>
            <CPRDisplay pp={results.pp} tc={results.tc} bc={results.bc} />
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-muted">{results.pos?.replace(/_/g, ' ')}</span>
              <span className="badge badge-blue">{results.cprPos?.replace(/_/g, ' ')}</span>
              <span className={`badge ${results.gap?.direction === 'Gap_Up' ? 'badge-green' : results.gap?.direction === 'Gap_Down' ? 'badge-red' : 'badge-muted'}`}>
                {results.gap?.direction?.replace(/_/g, ' ')} {results.gap?.sizePct?.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Overall Signal */}
          {signal && (
            <div className={`card ${signal === 'BULLISH' ? 'card-glow' : ''}`}
              style={{ padding: '20px', borderColor: signal === 'BULLISH' ? 'var(--accent-green)' : signal === 'BEARISH' ? 'var(--accent-red)' : 'var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div className="section-title" style={{ marginBottom: '8px' }}>Overall Signal</div>
                  <SignalBadge signal={signal} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stat-label">Confidence</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800,
                    color: signal === 'BULLISH' ? 'var(--accent-green)' : signal === 'BEARISH' ? 'var(--accent-red)' : 'var(--accent-gold)' }}>
                    {Math.round(Math.abs((signalData.bull - signalData.bear)) * 100)}%
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ProbRow label="Bullish" value={signalData.bull} color="var(--accent-green)" />
                <ProbRow label="Bearish" value={signalData.bear} color="var(--accent-red)" />
                {signalData.gapFill != null && (
                  <ProbRow label="Gap Fill" value={signalData.gapFill} color="var(--accent-blue)" />
                )}
              </div>
              {signal === 'BULLISH' && <div className="alert alert-success" style={{ marginTop: '14px' }}>
                ✅ Consider long entries with PDH breakout confirmation
              </div>}
              {signal === 'BEARISH' && <div className="alert alert-error" style={{ marginTop: '14px' }}>
                ✅ Consider short entries with PDL breakdown confirmation
              </div>}
              {signal === 'NEUTRAL' && <div className="alert alert-warning" style={{ marginTop: '14px' }}>
                ⚠️ Weak signal — wait for intraday confirmation before trade
              </div>}
            </div>
          )}

          {/* Candle Game */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="section-title" style={{ marginBottom: '14px' }}>Candle Game</div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>State: </span>
              <span style={{ fontSize: '13px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                {results.candleState?.replace(/\|/g, ' · ')}
              </span>
            </div>
            {candleRow ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <Gauge value={+candleRow.prob_trend_up} label="Trend Up" color="var(--accent-green)" />
                  <Gauge value={+candleRow.prob_range_chop} label="Range/Chop" color="var(--accent-gold)" />
                  <Gauge value={+candleRow.prob_trend_down} label="Trend Down" color="var(--accent-red)" />
                </div>
                <div className="stat-label" style={{ textAlign: 'center' }}>
                  Sample: {candleRow.total_count} days · Avg Next Day Range: {(+candleRow.avg_next_day_range_pct * 100).toFixed(1)}%
                </div>
              </div>
            ) : (
              <div className="alert alert-warning">No matching candle state in historical data.</div>
            )}
          </div>

          {/* Level Game */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="section-title" style={{ marginBottom: '14px' }}>Level Game</div>
            {Object.keys(scenarioGroups).length > 0 ? (
              Object.entries(scenarioGroups).map(([name, outcomes]) => (
                <ScenarioAccordion key={name} scenario={name} outcomes={outcomes} />
              ))
            ) : (
              <div className="alert alert-info">No level scenarios match today's open context.</div>
            )}
          </div>

          {/* Gap Game */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="section-title" style={{ marginBottom: '8px' }}>Gap Game</div>
            <div style={{ marginBottom: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className={`badge ${results.gap?.direction === 'Gap_Up' ? 'badge-green' : results.gap?.direction === 'Gap_Down' ? 'badge-red' : 'badge-muted'}`}>
                {results.gap?.direction?.replace(/_/g, ' ')}
              </span>
              <span className="badge badge-muted">{results.gap?.bucket}</span>
              <span className="badge badge-muted">{results.gap?.size?.toFixed(1)} pts</span>
            </div>
            {gapRow ? (
              <div style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gapChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#8899aa', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                      formatter={v => [`${v}%`, 'Probability']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {gapChartData.map((_, i) => (
                        <Cell key={i} fill={['#4a5a6a', '#f39c12', '#00d084'][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="alert alert-info">No gap data for this direction/bucket combination.</div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
