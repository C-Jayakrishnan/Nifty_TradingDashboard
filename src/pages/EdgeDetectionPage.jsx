import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart2, Info, Clock4, Sparkles, ArrowRight, Zap } from 'lucide-react'
import { ProbRow, Gauge, ScenarioAccordion } from '../components/Charts'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const MARKET_INDICATORS = [
  { label: 'Vol Pulse', value: '0.92x' },
  { label: 'Edge Signal', value: 'Neutral' },
  { label: 'Liquidity', value: 'High' },
]

const INSIGHTS = [
  'High probability of range day',
  'Avoid early breakout trades',
  'Watch for CPR touch at open',
]

const MARKET_SNAPSHOT = [
  { label: 'Previous Close', key: null, defaultValue: '21,998' },
  { label: 'Open', key: null, defaultValue: '22,012' },
  { label: 'High', key: null, defaultValue: '22,118' },
  { label: 'Low', key: null, defaultValue: '21,778' },
  { label: 'Gap %', key: 'avg_gap_size_pct', defaultValue: '0.18%' },
]

function formatPct(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export default function EdgeDetectionPage({ stats }) {
  const [gapView, setGapView] = useState('All')
  const now = new Date()
  const currentTime = now.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  })

  if (!stats) {
    return (
      <div className="edge-page">
        <div className="edge-card" style={{ maxWidth: '720px' }}>
          <div className="edge-panel-head">
            <div>
              <div className="edge-eyebrow">Edge Detection</div>
              <h2 style={{ margin: 0 }}>No statistics available</h2>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Upload or generate raw NIFTY analytics in the Developer tab to activate the dashboard.
          </p>
        </div>
      </div>
    )
  }

  const { candle_state_stats = [], open_context_stats = [], gap_stats = [] } = stats
  const topCandle = candle_state_stats[0] || {}
  const topGap = gap_stats[0] || {}
  const trendUp = topCandle.prob_trend_up ?? 0
  const rangePct = topCandle.prob_range_chop ?? 0
  const trendDown = topCandle.prob_trend_down ?? 0
  const edgeConfidence = Math.round(Math.max(trendUp, rangePct, trendDown) * 100)
  const statusLabel = edgeConfidence >= 60 ? (trendUp >= trendDown ? 'Bullish' : 'Bearish') : 'Neutral'
  const statusColor = statusLabel === 'Bullish'
    ? 'rgba(0,208,132,0.24)'
    : statusLabel === 'Bearish'
      ? 'rgba(255,71,87,0.24)'
      : 'rgba(255,211,42,0.24)'
  const marketState = rangePct >= 0.48 ? 'RANGE' : 'EXPANSION'
  const donutTotal = trendUp + rangePct + trendDown || 1

  const snapshotData = MARKET_SNAPSHOT.map(item => ({
    label: item.label,
    value: item.key
      ? topGap[item.key] != null
        ? item.key === 'avg_gap_size_pct'
          ? `${topGap[item.key].toFixed(2)}%`
          : topGap[item.key]
        : item.defaultValue
      : item.defaultValue,
  }))

  const gapData = [50, 80, 100].map(pct => ({
    name: `${pct}%`,
    value: Math.round(((topGap[`prob_fill_${pct}pct`] ?? 0) * 100) * 10) / 10,
  }))

  const scenarioRows = open_context_stats.slice(0, 3).map(row => ({
    scenario: row.open_context.replace(/_/g, ' '),
    outcomes: [
      {
        outcome: 'Trend Up',
        probability: row.prob_trend_up ?? 0,
        outcome_count: Math.round((row.prob_trend_up ?? 0) * row.total_count),
        total_count: row.total_count,
      },
      {
        outcome: 'Range',
        probability: row.prob_range_chop ?? 0,
        outcome_count: Math.round((row.prob_range_chop ?? 0) * row.total_count),
        total_count: row.total_count,
      },
      {
        outcome: 'Trend Down',
        probability: row.prob_trend_down ?? 0,
        outcome_count: Math.round((row.prob_trend_down ?? 0) * row.total_count),
        total_count: row.total_count,
      },
    ],
  }))

  return (
    <div className="edge-page">
      <div className="edge-header">
        <div>
          <div className="edge-eyebrow">Edge Detection</div>
          <h1>Market Command Center</h1>
          <p className="edge-subtitle">
            A premium cyber-fintech dashboard for NIFTY edge analytics, combining trade bias, gap analysis and state probability.
          </p>
        </div>
        <div className="edge-top-meta">
          <div className="live-pill">
            <span className="live-dot" /> Live market feed
          </div>
          <div className="edge-time">
            <Clock4 size={14} /> {currentTime}
          </div>
        </div>
      </div>

      <div className="edge-indicators">
        {MARKET_INDICATORS.map(indicator => (
          <div key={indicator.label} className="indicator-card">
            <span>{indicator.label}</span>
            <strong>{indicator.value}</strong>
          </div>
        ))}
      </div>

      <div className="edge-grid grid-2">
        <section className="edge-card market-snapshot">
          <div className="edge-panel-head">
            <div>
              <div className="edge-card-label">Market Snapshot</div>
              <h2>Intraday edge profile</h2>
            </div>
            <button className="btn btn-primary btn-glow">
              Compute Edges <ArrowRight size={14} />
            </button>
          </div>
          <div className="snapshot-grid">
            {snapshotData.map(item => (
              <div key={item.label} className="snapshot-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="snapshot-note">
            Live structures are synthesized from the latest gap and candle state analytics.
          </div>
        </section>

        <section className="edge-card hero-card">
          <div className="edge-panel-head">
            <div>
              <div className="edge-card-label">Trade Bias Engine</div>
              <h2>Edge Confidence</h2>
            </div>
            <span className="status-pill" style={{ background: statusColor }}>
              {statusLabel}
            </span>
          </div>
          <div className="hero-gauge">
            <Gauge value={edgeConfidence / 100} label="Confidence" color={statusLabel === 'Bullish' ? 'var(--accent-green)' : statusLabel === 'Bearish' ? 'var(--accent-red)' : 'var(--accent-gold)'} size={170} />
          </div>
          <div className="hero-detail">
            <div>
              <strong>{edgeConfidence}%</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Current trade bias strength</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Signal status</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{marketState}</div>
            </div>
          </div>
          <div className="hero-meta-grid">
            <div className="mini-stat">
              <div className="label">Trend Up</div>
              <div className="value">{formatPct(trendUp)}</div>
            </div>
            <div className="mini-stat">
              <div className="label">Range</div>
              <div className="value">{formatPct(rangePct)}</div>
            </div>
            <div className="mini-stat">
              <div className="label">Trend Down</div>
              <div className="value">{formatPct(trendDown)}</div>
            </div>
          </div>
        </section>
      </div>

      <div className="edge-grid grid-3">
        <section className="edge-card cpr-card">
          <div className="edge-card-label">CPR Levels</div>
          <div className="cpr-line">
            <div className="cpr-line-label">
              <strong>TC</strong>
              <span>Top Central</span>
            </div>
            <div className="cpr-line-visual" style={{ background: 'rgba(0,208,132,0.08)' }}>
              <div style={{ position: 'absolute', inset: 0, width: '62%', background: 'rgba(0,208,132,0.5)' }} />
            </div>
            <div style={{ minWidth: '78px', textAlign: 'right', color: 'var(--text-primary)' }}>22,106</div>
          </div>
          <div className="cpr-line">
            <div className="cpr-line-label">
              <strong>PP</strong>
              <span>Pivot Point</span>
            </div>
            <div className="cpr-line-visual" style={{ background: 'rgba(255,211,42,0.08)' }}>
              <div style={{ position: 'absolute', inset: 0, width: '42%', background: 'rgba(255,211,42,0.45)' }} />
            </div>
            <div style={{ minWidth: '78px', textAlign: 'right', color: 'var(--text-primary)' }}>22,014</div>
          </div>
          <div className="cpr-line">
            <div className="cpr-line-label">
              <strong>BC</strong>
              <span>Bottom Central</span>
            </div>
            <div className="cpr-line-visual" style={{ background: 'rgba(255,71,87,0.08)' }}>
              <div style={{ position: 'absolute', inset: 0, width: '28%', background: 'rgba(255,71,87,0.45)' }} />
            </div>
            <div style={{ minWidth: '78px', textAlign: 'right', color: 'var(--text-primary)' }}>21,924</div>
          </div>
        </section>

        <section className="edge-card candle-card">
          <div className="edge-panel-head" style={{ marginBottom: '12px' }}>
            <div>
              <div className="edge-card-label">Candle Game</div>
              <h2>Market State</h2>
            </div>
          </div>
          <div className="donut-chart" style={{ background: `conic-gradient(var(--accent-green) 0 ${trendUp / donutTotal * 360}deg, var(--accent-gold) ${trendUp / donutTotal * 360}deg ${((trendUp + rangePct) / donutTotal) * 360}deg, var(--accent-red) ${((trendUp + rangePct) / donutTotal) * 360}deg 360deg)` }}>
            <div className="donut-core">
              <strong>{marketState}</strong>
              <span>Market regime</span>
            </div>
          </div>
          <div className="donut-legend">
            <div className="donut-legend-item"><span className="donut-legend-dot" style={{ background: 'var(--accent-green)' }} />Trend Up {formatPct(trendUp)}</div>
            <div className="donut-legend-item"><span className="donut-legend-dot" style={{ background: 'var(--accent-gold)' }} />Range {formatPct(rangePct)}</div>
            <div className="donut-legend-item"><span className="donut-legend-dot" style={{ background: 'var(--accent-red)' }} />Trend Down {formatPct(trendDown)}</div>
          </div>
        </section>

        <section className="edge-card gap-card">
          <div className="gap-header">
            <div>
              <div className="edge-card-label">Gap Analysis</div>
              <h2>Probability heatmap</h2>
            </div>
          </div>
          <div className="gap-toggle">
            {['All', 'Gap Up', 'Gap Down'].map(option => (
              <button key={option} className={gapView === option ? 'active' : ''} onClick={() => setGapView(option)}>
                {option}
              </button>
            ))}
          </div>
          <div style={{ height: '210px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#8899aa', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }} formatter={v => [`${v}%`, 'Gap Fill']} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  <Cell fill="#00d084" />
                  <Cell fill="#ffd32a" />
                  <Cell fill="#ff4757" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="gap-highlight">
            Most probable gap fill: {gapData.reduce((best, item) => item.value > best.value ? item : best, gapData[0]).name}
          </div>
        </section>
      </div>

      <div className="edge-grid grid-2">
        <section className="edge-card level-card">
          <div className="edge-card-head">
            <div className="edge-card-label">Level Game</div>
            <h2>Scenario probability engine</h2>
          </div>
          {scenarioRows.length > 0 ? (
            scenarioRows.map(item => (
              <ScenarioAccordion key={item.scenario} scenario={item.scenario} outcomes={item.outcomes} />
            ))
          ) : (
            <div style={{ color: 'var(--text-secondary)', padding: '18px 0' }}>No level scenario analytics available yet.</div>
          )}
        </section>

        <section className="edge-card insight-card">
          <div className="edge-card-head">
            <div className="edge-card-label">Insight Engine</div>
            <h2>AI-style guidance</h2>
          </div>
          <p>
            The dashboard recommends tactical entry signals, regime awareness, and early warning cues for professional traders.
          </p>
          <div className="insight-list">
            {INSIGHTS.map((text, index) => (
              <div className="insight-item" key={text}>
                <div className="insight-badge">
                  {index === 0 ? <Sparkles size={18} /> : index === 1 ? <Zap size={18} /> : <Info size={18} />}
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
