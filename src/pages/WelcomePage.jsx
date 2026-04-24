import { useState, useEffect, useMemo } from 'react'
import { computeEdgeResults, getRelevantScenarios, computeLevelScenarioStats } from '../utils/calculations'
import { useSessionCache } from '../hooks/useData'
import { Gauge, DonutChart, CPRDisplay, ScenarioAccordion, SignalBadge, ProbRow, SectionHeading, InsightPanel } from '../components/Charts'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  Calculator,
  Target,
  Zap,
  BarChart2,
  Activity,
  Info,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

function Sparkline({ values, color }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = Math.max(max - min, 1)
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${32 - ((v - min) / span) * 26}`)
    .join(' ')

  return (
    <svg viewBox="0 0 100 32" width="100%" height="32" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  )
}

function SnapshotMetric({ label, value, change, direction, color, spark }) {
  const DirIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus

  return (
    <div className="card" style={{ padding: '16px', minHeight: 132, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
            {label}
          </div>
          <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.05 }}>
            {value}
          </div>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderRadius: 999,
          color,
          background: `${color}14`,
          border: `1px solid ${color}33`,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
        }}>
          <DirIcon size={13} />
          {change}
        </div>
      </div>
      <div>
        <div style={{ marginBottom: 8 }}>
          <Sparkline values={spark} color={color} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Live directional read from prior session structure
        </div>
      </div>
    </div>
  )
}

const ACTION_COPY = {
  BULLISH: 'Lean long on breakout confirmation',
  BEARISH: 'Lean short on weakness confirmation',
  NEUTRAL: 'Wait for confirmation',
}

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

  const set = k => e => setInputs(prev => ({ ...prev, [k]: e.target.value }))

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
    if (stats?.level_game_stats) setLevelScenarios(computeLevelScenarioStats(stats.level_game_stats))
  }

  useEffect(() => {
    if (cache.prevHigh && cache.prevLow && cache.prevClose && stats) compute()
  }, [stats]) // eslint-disable-line

  const candleRow = results && stats?.candle_state_stats?.find(r => r.candle_state === results.candleState)
  const openRow = results && stats?.open_context_stats?.find(r => r.open_context === results.openContext)
  const gapRow = results && stats?.gap_stats?.find(r =>
    r.gap_direction === results.gap.direction && r.gap_bucket === results.gap.bucket)

  let signal = null
  let signalData = null
  if (candleRow && openRow) {
    const bull = (+candleRow.prob_trend_up + +openRow.prob_trend_up) / 2
    const bear = (+candleRow.prob_trend_down + +openRow.prob_trend_down) / 2
    signal = bull > bear + 0.05 ? 'BULLISH' : bear > bull + 0.05 ? 'BEARISH' : 'NEUTRAL'
    signalData = { bull, bear, chop: (bull + bear) < 1 ? 1 - bull - bear : 0, gapFill: gapRow ? +gapRow.prob_fill_100pct : null }
  }

  const relScenarioNames = results ? getRelevantScenarios(results.pos, results.cprPos) : []
  const relScenarios = levelScenarios.filter(s => relScenarioNames.includes(s.scenario))
  const scenarioGroups = {}
  relScenarios.forEach(r => {
    if (!scenarioGroups[r.scenario]) scenarioGroups[r.scenario] = []
    scenarioGroups[r.scenario].push(r)
  })

  const gapChartData = gapRow ? [
    { name: '50%', value: +(+gapRow.prob_fill_50pct * 100).toFixed(1), color: 'var(--text-muted)' },
    { name: '80%', value: +(+gapRow.prob_fill_80pct * 100).toFixed(1), color: 'var(--amber)' },
    { name: '100%', value: +(+gapRow.prob_fill_100pct * 100).toFixed(1), color: 'var(--cyan)' },
  ] : []

  const signalBorderColor = signal === 'BULLISH'
    ? 'rgba(57,255,133,0.2)'
    : signal === 'BEARISH'
    ? 'rgba(255,61,107,0.2)'
    : 'rgba(255,182,39,0.2)'

  const prevRange = useMemo(() => {
    const high = +inputs.prevHigh || 0
    const low = +inputs.prevLow || 0
    return high && low ? high - low : 0
  }, [inputs.prevHigh, inputs.prevLow])

  const gapValue = useMemo(() => {
    const open = +inputs.todayOpen || 0
    const close = +inputs.prevClose || 0
    return open && close ? ((open - close) / close) * 100 : 0
  }, [inputs.todayOpen, inputs.prevClose])

  const snapshotCards = [
    {
      label: 'Prev Session Range',
      value: prevRange ? prevRange.toFixed(2) : '0.00',
      change: `${(prevRange ? (prevRange / Math.max(+inputs.prevClose || 1, 1)) * 100 : 0).toFixed(2)}%`,
      direction: prevRange > 0 ? 'up' : 'flat',
      color: 'var(--cyan)',
      spark: [20, 28, 24, 32, 26, 35, 30],
    },
    {
      label: 'Opening Gap',
      value: `${gapValue >= 0 ? '+' : ''}${gapValue.toFixed(2)}%`,
      change: `${gapValue >= 0 ? 'Gap Up' : 'Gap Down'}`,
      direction: gapValue > 0 ? 'up' : gapValue < 0 ? 'down' : 'flat',
      color: gapValue > 0 ? 'var(--green)' : gapValue < 0 ? 'var(--red)' : 'var(--amber)',
      spark: gapValue > 0 ? [14, 18, 16, 24, 21, 28, 26] : [28, 26, 22, 20, 17, 14, 12],
    },
    {
      label: 'Signal Pressure',
      value: signalData ? `${Math.round(Math.abs(signalData.bull - signalData.bear) * 100)}` : '0',
      change: signal ? signal.toLowerCase() : 'waiting',
      direction: signal === 'BULLISH' ? 'up' : signal === 'BEARISH' ? 'down' : 'flat',
      color: signal === 'BULLISH' ? 'var(--green)' : signal === 'BEARISH' ? 'var(--red)' : 'var(--amber)',
      spark: signal === 'BEARISH' ? [30, 27, 24, 18, 14, 11, 8] : [12, 16, 15, 19, 23, 25, 28],
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {!stats && (
        <div className="alert alert-warning" style={{ marginBottom: 2, alignItems: 'center' }}>
          <Info size={14} /> No backtest data - go to <strong style={{ marginLeft: 4 }}>Dev</strong> tab to upload stats CSVs.
        </div>
      )}

      <div className="edge-bias-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(320px, 0.95fr)', gap: 16, alignItems: 'stretch' }}>
        <div className="card" style={{ padding: '22px 24px', minHeight: 430 }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div className="hud-corner tl" /><div className="hud-corner tr" />
            <div className="hud-corner bl" /><div className="hud-corner br" />
            <div style={{
              position: 'absolute',
              right: -80,
              top: -80,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 68%)',
            }} />
          </div>

          <SectionHeading icon={Zap} action={signal ? <SignalBadge signal={signal} /> : null}>
            Trade Bias Engine
          </SectionHeading>

          <div className="edge-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 20, alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {results && signal && signalData ? (
                <Gauge
                  value={Math.abs(signalData.bull - signalData.bear)}
                  label="Bias Confidence"
                  subtitle={signal === 'BULLISH' ? 'Momentum stack favors upside continuation' : signal === 'BEARISH' ? 'Pressure stack favors downside expansion' : 'Bias is mixed across candle and open context'}
                  actionLabel={ACTION_COPY[signal]}
                  color={signal === 'BULLISH' ? 'var(--green)' : signal === 'BEARISH' ? 'var(--red)' : 'var(--amber)'}
                  size={250}
                />
              ) : (
                <div style={{
                  minHeight: 260,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Load market inputs to activate the bias engine
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{
                padding: '18px',
                borderRadius: 18,
                border: `1px solid ${results && signal ? signalBorderColor : 'var(--border-subtle)'}`,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Action Insight
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {signal ? ACTION_COPY[signal] : 'Await inputs'}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 520 }}>
                  {signal === 'BULLISH' && 'Let price hold above the opening auction before taking momentum continuation. Add size only when breakout acceptance is clean.'}
                  {signal === 'BEARISH' && 'Respect failed recoveries and prioritize breakdown quality. Keep risk tight if the opening range starts reclaiming quickly.'}
                  {signal === 'NEUTRAL' && 'The data stack is balanced. Preserve capital and wait for a clearer trigger around CPR and opening range structure.'}
                  {!signal && 'Previous day range, close, and today open are enough to light up the dashboard with a directional read.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Trend Up
                  </div>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--green)', marginBottom: 8 }}>
                    {signalData ? `${Math.round(signalData.bull * 100)}%` : '--'}
                  </div>
                  <ProbRow label="Confidence" value={signalData?.bull || 0} color="var(--green)" />
                </div>
                <div className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Trend Down
                  </div>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--red)', marginBottom: 8 }}>
                    {signalData ? `${Math.round(signalData.bear * 100)}%` : '--'}
                  </div>
                  <ProbRow label="Confidence" value={signalData?.bear || 0} color="var(--red)" />
                </div>
                <div className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Gap Fill
                  </div>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--cyan)', marginBottom: 8 }}>
                    {signalData?.gapFill != null ? `${Math.round(signalData.gapFill * 100)}%` : '--'}
                  </div>
                  <ProbRow label="100% Fill" value={signalData?.gapFill || 0} color="var(--cyan)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: '20px 22px' }}>
            <SectionHeading icon={Calculator}>Market Snapshot</SectionHeading>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Prev Open', k: 'prevOpen' },
                { label: 'Prev High', k: 'prevHigh' },
                { label: 'Prev Low', k: 'prevLow' },
                { label: 'Prev Close', k: 'prevClose' },
              ].map(({ label, k }) => (
                <div className="form-group" key={k}>
                  <label className="label">{label}</label>
                  <input
                    className="input"
                    type="number"
                    step="0.05"
                    placeholder="0.00"
                    value={inputs[k]}
                    onChange={set(k)}
                    style={{ fontSize: 15, fontWeight: 600, textAlign: 'right' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div className="form-group">
                <label className="label">Today&apos;s Open</label>
                <input
                  className="input"
                  type="number"
                  step="0.05"
                  placeholder="0.00"
                  value={inputs.todayOpen}
                  onChange={set('todayOpen')}
                  style={{ fontSize: 15, fontWeight: 600, textAlign: 'right', borderColor: 'rgba(0,229,255,0.22)' }}
                />
              </div>
              <div className="form-group">
                <label className="label">Date</label>
                <input className="input" type="date" value={inputs.testDate} onChange={set('testDate')} />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}>
              {snapshotCards.map(card => (
                <SnapshotMetric key={card.label} {...card} />
              ))}
            </div>

            <button className="btn-neon" onClick={compute} disabled={!inputs.prevHigh || !inputs.prevLow || !inputs.prevClose}>
              <Calculator size={15} strokeWidth={2.5} />
              Compute Edges
            </button>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <SectionHeading icon={Activity}>Execution Notes</SectionHeading>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Session Context
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
                  {results?.openContext?.replaceAll('_', ' ') || 'Waiting for market snapshot'}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  Use this as the opening auction lens before trusting directional continuation.
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Candle State
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
                  {results?.candleState?.replaceAll('|', ' · ').replaceAll('_', ' ') || 'Waiting for bias computation'}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  This pattern drives the trend/chop expectations feeding the main engine.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results && (
        <div className="card fade-in" style={{ padding: '20px 22px' }}>
          <SectionHeading icon={BarChart2} action={
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[results.pos, results.cprPos].filter(Boolean).map(t => (
                <span key={t} className="badge badge-muted" style={{ fontSize: 10 }}>{t.replace(/_/g, ' ')}</span>
              ))}
            </div>
          }>
            CPR Levels
          </SectionHeading>
          <CPRDisplay pp={results.pp} tc={results.tc} bc={results.bc} />
        </div>
      )}

      {results && (
        <div className="edge-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.1fr)', gap: 16 }}>
          <div className="card fade-in" style={{ padding: '20px 22px' }}>
            <SectionHeading icon={Activity}>Candle Game</SectionHeading>
            <div style={{ marginBottom: 14 }}>
              {results.candleState?.split('|').map((p, i) => (
                <span key={i} className={i === 0 ? 'badge badge-gold' : 'badge badge-muted'} style={{ fontSize: 10, marginRight: 4 }}>
                  {p.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            {candleRow ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  <DonutChart
                    up={+candleRow.prob_trend_up}
                    chop={+candleRow.prob_range_chop}
                    down={+candleRow.prob_trend_down}
                    size={170}
                  />
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8, letterSpacing: '0.06em' }}>
                  SAMPLE: {candleRow.total_count} DAYS · AVG RANGE: {(+candleRow.avg_next_day_range_pct * 100).toFixed(1)}%
                </div>
              </>
            ) : (
              <div className="alert alert-warning" style={{ fontSize: 11 }}><Info size={12} /> No match in historical data</div>
            )}
          </div>

          <div className="card fade-in" style={{ padding: '20px 22px', overflowY: 'auto', maxHeight: 420 }}>
            <SectionHeading icon={Target}>Level Game</SectionHeading>
            {Object.keys(scenarioGroups).length > 0
              ? Object.entries(scenarioGroups).map(([name, outcomes]) => (
                <ScenarioAccordion key={name} scenario={name} outcomes={outcomes} />
              ))
              : <div className="alert alert-info" style={{ fontSize: 11 }}><Info size={12} /> No scenarios match current context</div>
            }
          </div>
        </div>
      )}

      {results && gapRow && (
        <div className="card fade-in" style={{ padding: '20px 22px' }}>
          <SectionHeading icon={BarChart2}>Gap Analysis</SectionHeading>
          <div className="edge-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 0.8fr) 1fr', gap: 18, alignItems: 'center' }}>
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gapChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-primary)' }}
                    formatter={v => [`${v}%`, 'Fill Prob']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {gapChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span className={`badge ${results.gap?.direction === 'Gap_Up' ? 'badge-green' : results.gap?.direction === 'Gap_Down' ? 'badge-red' : 'badge-muted'}`}>
                    {results.gap?.direction?.replace(/_/g, ' ')}
                  </span>
                  <span className="badge badge-blue">{results.gap?.bucket}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {results.gap?.size?.toFixed(1)} pts
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {gapRow.total_count} day sample powering the current gap model.
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Bias Read
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <ProbRow label="50% Fill" value={+gapRow.prob_fill_50pct} color="var(--text-secondary)" />
                  <ProbRow label="80% Fill" value={+gapRow.prob_fill_80pct} color="var(--amber)" />
                  <ProbRow label="100% Fill" value={+gapRow.prob_fill_100pct} color="var(--cyan)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {results && signal && (
        <div style={{ marginTop: -2 }}>
          <InsightPanel signal={signal} candleState={results.candleState} openContext={results.openContext} gap={results.gap} />
        </div>
      )}
    </div>
  )
}
