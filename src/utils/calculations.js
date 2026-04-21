// ─── CPR Computation ────────────────────────────────────────────────────────
export function computeCPR(prevH, prevL, prevC) {
  const pp = (prevH + prevL + prevC) / 3.0
  const bc = (prevH + prevL) / 2.0
  let tc = (pp - bc) + pp
  if (tc < bc) return { pp, tc: bc, bc: tc }
  return { pp, tc, bc }
}

// ─── Candle Metrics ──────────────────────────────────────────────────────────
export function candleMetrics(o, h, l, c) {
  const range = h - l
  if (range === 0) return null
  const body = Math.abs(c - o)
  const upperWick = h - Math.max(o, c)
  const lowerWick = Math.min(o, c) - l
  return {
    body_pct: body / range,
    upper_pct: upperWick / range,
    lower_pct: lowerWick / range,
    wick_imb: (upperWick - lowerWick) / range,
    top_rej: (h - c) / range,
    bot_rej: (c - l) / range,
  }
}

// ─── Candle State Classification ─────────────────────────────────────────────
export function classifyCandleState(metrics, thresholds) {
  if (!metrics || !thresholds) return 'Balanced_Neutral'
  const { body_70 = 0.6, body_30 = 0.3 } = thresholds
  const { body_pct: bp, upper_pct: up, lower_pct: lo, wick_imb, top_rej, bot_rej } = metrics

  let base
  if (bp > body_70 && up < 0.2 && lo < 0.2) base = 'Strong_Acceptance'
  else if (bp < body_30 && (up > 0.4 || lo > 0.4)) base = 'Exhaustion_Rejection'
  else if (bp > body_70 && (up > 0.3 || lo > 0.3)) base = 'Expansion'
  else if (bp < body_30 && up < 0.3 && lo < 0.3) base = 'Compression'
  else base = 'Balanced_Neutral'

  const tags = []
  if (wick_imb > 0.3) tags.push('Upper_Wick_Dominant')
  if (wick_imb < -0.3) tags.push('Lower_Wick_Dominant')
  if (top_rej < 0.2) tags.push('Close_Near_High')
  if (bot_rej < 0.2) tags.push('Close_Near_Low')

  return tags.length ? `${base}|${tags.join('|')}` : base
}

// ─── Open Context Classification ─────────────────────────────────────────────
export function classifyOpenContext(open, pdh, pdl, tc, bc) {
  if (!open || !pdh || !pdl) return 'Unknown'
  const prevRange = pdh - pdl
  const parts = []

  const insideRange = open >= pdl && open <= pdh
  if (open > pdh) parts.push('Open_Above_PDH')
  else if (open < pdl) parts.push('Open_Below_PDL')
  else parts.push('Open_Inside_Prev_Range')

  if (tc != null && bc != null) {
    if (open > tc) parts.push('Above_CPR')
    else if (open < bc) parts.push('Below_CPR')
    else parts.push('Inside_CPR')
  }

  if (insideRange && prevRange > 0) {
    if ((pdh - open) / prevRange < 0.25) parts.push('Open_Top_Quartile')
    else if ((open - pdl) / prevRange < 0.25) parts.push('Open_Bottom_Quartile')
    else parts.push('Open_Middle_Half')
  }

  return parts.join('|')
}

// ─── Gap Analysis ─────────────────────────────────────────────────────────────
export function analyzeGap(todayOpen, prevClose) {
  if (!todayOpen || !prevClose) return { direction: null, bucket: null, size: 0 }
  const gap = todayOpen - prevClose
  const sizePct = Math.abs(gap) / prevClose * 100

  let direction = null
  if (gap > 0.01) direction = 'Gap_Up'
  else if (gap < -0.01) direction = 'Gap_Down'
  else direction = 'No_Gap'

  let bucket = null
  if (sizePct < 0.5) bucket = '0-0.5%'
  else if (sizePct < 1.0) bucket = '0.5-1%'
  else if (sizePct < 2.0) bucket = '1-2%'
  else bucket = '>2%'

  return { direction, bucket, size: gap, sizePct }
}

// ─── Edge Results Computation ────────────────────────────────────────────────
export function computeEdgeResults(inputs, statsData, thresholds) {
  const { prevOpen, prevHigh, prevLow, prevClose, todayOpen } = inputs
  if (!prevHigh || !prevLow || !prevClose) return null

  const { pp, tc, bc } = computeCPR(prevHigh, prevLow, prevClose)
  const metrics = candleMetrics(prevOpen, prevHigh, prevLow, prevClose)
  const candleState = classifyCandleState(metrics, thresholds)
  const openContext = classifyOpenContext(todayOpen, prevHigh, prevLow, tc, bc)
  const gap = analyzeGap(todayOpen, prevClose)

  // Parse position and CPR position from open context
  const ctxParts = openContext.split('|')
  const pos = ctxParts[0] || ''
  const cprPos = ctxParts[1] || ''

  return {
    pp: pp.toFixed(2),
    tc: tc.toFixed(2),
    bc: bc.toFixed(2),
    candleState,
    openContext,
    pos,
    cprPos,
    gap,
    metrics,
  }
}

// ─── Level Game Scenarios ──────────────────────────────────────────────────
export function getRelevantScenarios(pos, cprPos) {
  const scenarios = []
  if (pos === 'Open_Inside_Prev_Range') {
    if (cprPos === 'Below_CPR') {
      scenarios.push('Open below BC', 'Open below BC & Touched BC', 'Open below BC & No touch BC', 'Breaks TC from below')
    } else if (cprPos === 'Above_CPR') {
      scenarios.push('Open above TC', 'Open above TC & Touched TC')
    } else if (cprPos === 'Inside_CPR') {
      scenarios.push('Open inside CPR')
    }
  }
  scenarios.push('Touched Prev Day High', 'Touched Prev Day Low')
  return [...new Set(scenarios)]
}

// ─── Backtest Processing (JS port of backtest_nifty.py) ─────────────────────
export function runBacktest(rows) {
  // rows: [{Date, Open, High, Low, Close}, ...]
  const df = rows.map(r => ({
    Date: r.Date,
    Open: +r.Open,
    High: +r.High,
    Low: +r.Low,
    Close: +r.Close,
  })).filter(r => !isNaN(r.Open) && r.Date)
   .sort((a, b) => new Date(a.Date) - new Date(b.Date))

  const n = df.length

  // Attach shifted columns
  for (let i = 0; i < n; i++) {
    const prev = df[i - 1]
    df[i].PDH = prev?.High ?? null
    df[i].PDL = prev?.Low ?? null
    df[i].PDC = prev?.Close ?? null
    df[i].PDO = prev?.Open ?? null
    df[i].prev_close = prev?.Close ?? null
    df[i].prev_range = prev ? (prev.High - prev.Low) : null

    if (prev) {
      const { pp, tc, bc } = computeCPR(prev.High, prev.Low, prev.Close)
      df[i].PP = pp; df[i].TC = tc; df[i].BC = bc
      df[i].CPR_width = tc - bc

      const m = candleMetrics(prev.Open, prev.High, prev.Low, prev.Close)
      df[i]._prevMetrics = m
    }

    // next-day refs
    const next = df[i + 1]
    df[i].next_high = next?.High ?? null
    df[i].next_low = next?.Low ?? null
    df[i].next_close = next?.Close ?? null
    df[i].next_open = next?.Open ?? null
  }

  // Compute rolling p70/p30 for candle classification
  const bodyPctArr = df.map(r => r._prevMetrics?.body_pct ?? null)
  function rollingQuantile(arr, idx, window, q) {
    const start = Math.max(0, idx - window)
    const slice = arr.slice(start, idx).filter(v => v !== null).sort((a, b) => a - b)
    if (slice.length < 10) return null
    const pos = q * (slice.length - 1)
    const lo = Math.floor(pos), hi = Math.ceil(pos)
    return slice[lo] + (pos - lo) * (slice[hi] - slice[lo])
  }

  const allStates = []
  for (let i = 0; i < n; i++) {
    const m = df[i]._prevMetrics
    if (!m) { allStates.push('Balanced_Neutral'); continue }
    const p70 = rollingQuantile(bodyPctArr, i, 20, 0.7)
    const p30 = rollingQuantile(bodyPctArr, i, 20, 0.3)
    const th = p70 && p30 ? { body_70: p70, body_30: p30 } : { body_70: 0.6, body_30: 0.3 }
    allStates.push(classifyCandleState(m, th))
  }
  df.forEach((r, i) => { r.candle_state = allStates[i] })

  // Open context
  df.forEach(r => {
    r.open_context = classifyOpenContext(r.Open, r.PDH, r.PDL, r.TC, r.BC)
  })

  // Next-day outcomes
  df.forEach(r => {
    const { next_high: nh, next_low: nl, next_close: nc, next_open: no, prev_range, PDH, PDL } = r
    if (nh == null || nl == null) { r.next_day_outcome = null; return }
    const nrange = nh - nl
    const nbody = Math.abs(nc - no) / (nrange || 1)
    const parts = []
    if (nbody > 0.6 && nc > no) parts.push('Trend_Up_Day')
    else if (nbody > 0.6 && nc < no) parts.push('Trend_Down_Day')
    else parts.push('Range_Chop_Day')
    if (nh > PDH && nc < PDH) parts.push('False_PDH_Break')
    if (nl < PDL && nc > PDL) parts.push('False_PDL_Break')
    if (nh > PDH && nc >= PDH) parts.push('PDH_Break_Success')
    if (nl < PDL && nc <= PDL) parts.push('PDL_Break_Success')
    if (prev_range && nrange > prev_range * 1.2) parts.push('Expansion_Day')
    r.next_day_outcome = parts.join('|')
    r.false_pdh_break = nh > PDH && nc < PDH
    r.false_pdl_break = nl < PDL && nc > PDL
    r.pdh_break_success = nh > PDH && nc >= PDH
    r.pdl_break_success = nl < PDL && nc <= PDL
    r.next_range_pct = prev_range ? nrange / prev_range : null
  })

  // Gap analysis
  df.forEach(r => {
    const g = r.Open - (r.prev_close ?? r.Open)
    r.gap = g
    r.gap_direction = g > 0.01 ? 'Gap_Up' : g < -0.01 ? 'Gap_Down' : 'No_Gap'
    r.gap_size_pct = Math.abs(g) / (r.prev_close || 1)
    const pct = r.gap_size_pct * 100
    r.gap_bucket = pct < 0.5 ? '0-0.5%' : pct < 1 ? '0.5-1%' : pct < 2 ? '1-2%' : '>2%'
    if (g > 0) {
      r.fill_100pct = r.Low <= r.prev_close
      r.fill_80pct = r.Low <= r.prev_close + 0.8 * g
      r.fill_50pct = r.Low <= r.prev_close + 0.5 * g
    } else if (g < 0) {
      const ag = Math.abs(g)
      r.fill_100pct = r.High >= r.prev_close
      r.fill_80pct = r.High >= r.prev_close - 0.8 * ag
      r.fill_50pct = r.High >= r.prev_close - 0.5 * ag
    } else {
      r.fill_100pct = r.fill_80pct = r.fill_50pct = false
    }
  })

  // Aggregate candle stats
  const candleGroups = {}
  df.filter(r => r.candle_state && r.next_day_outcome).forEach(r => {
    if (!candleGroups[r.candle_state]) candleGroups[r.candle_state] = []
    candleGroups[r.candle_state].push(r)
  })
  const candle_state_stats = Object.entries(candleGroups).map(([state, rows]) => {
    const n = rows.length
    const mean = arr => arr.reduce((s, v) => s + (v ?? 0), 0) / arr.length
    return {
      candle_state: state,
      total_count: n,
      prob_trend_up: rows.filter(r => r.next_day_outcome?.includes('Trend_Up_Day')).length / n,
      prob_trend_down: rows.filter(r => r.next_day_outcome?.includes('Trend_Down_Day')).length / n,
      prob_range_chop: rows.filter(r => r.next_day_outcome?.includes('Range_Chop_Day')).length / n,
      avg_next_day_range_pct: mean(rows.map(r => r.next_range_pct)),
    }
  })

  // Aggregate open context stats
  const openGroups = {}
  df.filter(r => r.open_context && r.next_day_outcome).forEach(r => {
    if (!openGroups[r.open_context]) openGroups[r.open_context] = []
    openGroups[r.open_context].push(r)
  })
  const open_context_stats = Object.entries(openGroups).map(([ctx, rows]) => {
    const n = rows.length
    const mean = arr => arr.reduce((s, v) => s + (v ?? 0), 0) / arr.length
    return {
      open_context: ctx,
      total_count: n,
      prob_trend_up: rows.filter(r => r.next_day_outcome?.includes('Trend_Up_Day')).length / n,
      prob_trend_down: rows.filter(r => r.next_day_outcome?.includes('Trend_Down_Day')).length / n,
      prob_range_chop: rows.filter(r => r.next_day_outcome?.includes('Range_Chop_Day')).length / n,
      prob_pdh_break_success: rows.filter(r => r.pdh_break_success).length / n,
      prob_pdl_break_success: rows.filter(r => r.pdl_break_success).length / n,
      prob_false_pdh_break: rows.filter(r => r.false_pdh_break).length / n,
      prob_false_pdl_break: rows.filter(r => r.false_pdl_break).length / n,
      avg_next_day_range_pct: mean(rows.map(r => r.next_range_pct)),
    }
  })

  // Gap stats
  const gapGroups = {}
  df.filter(r => r.gap_direction !== 'No_Gap' && r.gap_direction).forEach(r => {
    const key = `${r.gap_direction}___${r.gap_bucket}`
    if (!gapGroups[key]) gapGroups[key] = []
    gapGroups[key].push(r)
  })
  const gap_stats = Object.entries(gapGroups).map(([key, rows]) => {
    const [gap_direction, gap_bucket] = key.split('___')
    const n = rows.length
    const mean = arr => arr.reduce((s, v) => s + (v ? 1 : 0), 0) / arr.length
    return {
      gap_direction, gap_bucket,
      total_count: n,
      prob_fill_50pct: mean(rows.map(r => r.fill_50pct)),
      prob_fill_80pct: mean(rows.map(r => r.fill_80pct)),
      prob_fill_100pct: mean(rows.map(r => r.fill_100pct)),
      avg_gap_size_pct: rows.reduce((s, r) => s + r.gap_size_pct, 0) / n,
    }
  })

  // Level game stats
  const levelStats = computeLevelGameStats(df)

  // Global thresholds
  const allBody = df.map(r => r._prevMetrics?.body_pct).filter(v => v != null).sort((a, b) => a - b)
  const body_70 = allBody[Math.floor(allBody.length * 0.7)] ?? 0.6
  const body_30 = allBody[Math.floor(allBody.length * 0.3)] ?? 0.3
  const thresholds = { body_70, body_30 }

  return { candle_state_stats, open_context_stats, gap_stats, level_game_stats: levelStats, thresholds }
}

function computeLevelGameStats(df) {
  const stats = []
  df.forEach(row => {
    const { Date: date, Open: openp, High: high, Low: low, Close: close, PDH, PDL, TC, BC } = row
    if (!date) return
    const levels = { PDH, PDL, TC, BC }
    Object.entries(levels).forEach(([lvl_name, lvl_val]) => {
      if (lvl_val == null || openp == null || high == null || low == null || close == null) return
      if (isNaN(lvl_val)) return

      const first_touch = high >= lvl_val && low <= lvl_val
      let broken = false, broken_direction = null
      if (openp < lvl_val) {
        broken = high > lvl_val; broken_direction = 'Up'
      } else if (openp > lvl_val) {
        broken = low < lvl_val; broken_direction = 'Down'
      }
      let after_break_retouch = null, break_success = null
      if (broken) {
        if (broken_direction === 'Up') {
          after_break_retouch = close < lvl_val
          break_success = close >= lvl_val
        } else {
          after_break_retouch = close > lvl_val
          break_success = close <= lvl_val
        }
      }
      stats.push({ Date: date, Level: lvl_name, LevelValue: lvl_val, Open: openp, High: high, Low: low, Close: close,
        FirstTouch: first_touch, Broken: broken, BrokenDirection: broken_direction,
        AfterBreakRetouch: after_break_retouch, BreakSuccess: break_success })
    })
  })
  return stats
}

// ─── Level Scenario Stats (from raw level game data) ─────────────────────────
export function computeLevelScenarioStats(levelRaw) {
  if (!levelRaw || levelRaw.length === 0) return []

  // Build per-date pivot
  const byDate = {}
  levelRaw.forEach(r => {
    const d = r.Date
    if (!byDate[d]) byDate[d] = { Date: d, Open: +r.Open, High: +r.High, Low: +r.Low, Close: +r.Close }
    const lvl = r.Level
    byDate[d][`FirstTouch_${lvl}`] = r.FirstTouch === true || r.FirstTouch === 'true'
    byDate[d][`Broken_${lvl}`] = r.Broken === true || r.Broken === 'true'
    byDate[d][`BrokenDirection_${lvl}`] = r.BrokenDirection
    byDate[d][`BreakSuccess_${lvl}`] = r.BreakSuccess === true || r.BreakSuccess === 'true'
    byDate[d][`LevelValue_${lvl}`] = +r.LevelValue
  })
  const daily = Object.values(byDate)
  daily.forEach(r => {
    r.BC = r.LevelValue_BC
    r.TC = r.LevelValue_TC
    r.PDH = r.LevelValue_PDH
    r.PDL = r.LevelValue_PDL
  })

  const get = (r, k) => r[k] ?? false
  const scenarios = [
    ['Open below BC', r => r.Open < (r.BC ?? -Infinity), [
      ['Touched BC', r => get(r, 'FirstTouch_BC')],
      ['Never touched BC', r => !get(r, 'FirstTouch_BC')],
    ]],
    ['Open below BC & Touched BC', r => r.Open < (r.BC ?? -Infinity) && get(r, 'FirstTouch_BC'), [
      ['Breaks TC', r => get(r, 'Broken_TC')],
      ['Closes below BC', r => r.Close < (r.BC ?? -Infinity)],
    ]],
    ['Open below BC & No touch BC', r => r.Open < (r.BC ?? -Infinity) && !get(r, 'FirstTouch_BC'), [
      ['Breaks Prev Low', r => get(r, 'Broken_PDL')],
    ]],
    ['Open above TC', r => r.Open > (r.TC ?? Infinity), [
      ['Touched TC', r => get(r, 'FirstTouch_TC')],
      ['Never touched TC', r => !get(r, 'FirstTouch_TC')],
    ]],
    ['Open above TC & Touched TC', r => r.Open > (r.TC ?? Infinity) && get(r, 'FirstTouch_TC'), [
      ['Breaks BC', r => get(r, 'Broken_BC')],
      ['Closes above TC', r => r.Close > (r.TC ?? Infinity)],
    ]],
    ['Open inside CPR', r => r.Open >= (r.BC ?? -Infinity) && r.Open <= (r.TC ?? Infinity), [
      ['Closes above TC', r => r.Close > (r.TC ?? Infinity)],
      ['Closes below BC', r => r.Close < (r.BC ?? -Infinity)],
      ['Closes within CPR', r => r.Close >= (r.BC ?? -Infinity) && r.Close <= (r.TC ?? Infinity)],
    ]],
    ['Touched Prev Day High', r => get(r, 'FirstTouch_PDH'), [
      ['Rejection at PDH', r => r.High > (r.PDH ?? -Infinity) && r.Close < (r.PDH ?? -Infinity)],
      ['Strong breakout above PDH', r => r.High > (r.PDH ?? -Infinity) && r.Close > (r.PDH ?? -Infinity)],
    ]],
    ['Touched Prev Day Low', r => get(r, 'FirstTouch_PDL'), [
      ['Bounce from PDL', r => r.Low < (r.PDL ?? Infinity) && r.Close > (r.PDL ?? Infinity)],
      ['Strong breakdown below PDL', r => r.Low < (r.PDL ?? Infinity) && r.Close < (r.PDL ?? Infinity)],
    ]],
    ['Breaks TC from below', r => r.Open < (r.BC ?? -Infinity) && r.High > (r.TC ?? -Infinity), [
      ['Closes above TC', r => r.Close > (r.TC ?? Infinity)],
      ['Closes below BC', r => r.Close < (r.BC ?? -Infinity)],
    ]],
  ]

  const records = []
  scenarios.forEach(([name, cond, outcomes]) => {
    const matching = daily.filter(cond)
    const total = matching.length
    if (total === 0) return
    outcomes.forEach(([outName, outCond]) => {
      const count = matching.filter(outCond).length
      records.push({ scenario: name, outcome: outName, total_count: total, outcome_count: count, probability: count / total })
    })
  })
  return records
}

// ─── CSV Parser (for raw NIFTY data in the given format) ─────────────────────
export function parseNiftyCSV(text) {
  const lines = text.trim().split('\n')
  // Find header line (contains Date, Open, High, Low, Close)
  let headerIdx = 0
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].toLowerCase().includes('open') && lines[i].toLowerCase().includes('close')) {
      headerIdx = i; break
    }
  }
  const sep = lines[headerIdx].includes('\t') ? '\t' : ','
  const headers = lines[headerIdx].split(sep).map(h => h.trim())

  const find = kw => {
    const idx = headers.findIndex(h => h.toLowerCase().includes(kw.toLowerCase()))
    return idx >= 0 ? idx : null
  }
  const dateIdx = find('date'), openIdx = find('open'), highIdx = find('high'), lowIdx = find('low'), closeIdx = find('close')
  if (dateIdx == null || openIdx == null) return []

  const rows = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim())
    if (cols.length < 5) continue
    const dateStr = cols[dateIdx]
    if (!dateStr) continue
    // Parse DD-MM-YYYY
    let date = dateStr
    const m = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (m) date = `${m[3]}-${m[2]}-${m[1]}`
    rows.push({
      Date: date,
      Open: parseFloat(cols[openIdx]),
      High: parseFloat(cols[highIdx]),
      Low: parseFloat(cols[lowIdx]),
      Close: parseFloat(cols[closeIdx]),
    })
  }
  return rows.filter(r => !isNaN(r.Open) && r.Date)
}

// ─── P&L helpers ─────────────────────────────────────────────────────────────
export function calcPnL(trade) {
  const { instrument, entry_price, exit_price, qty_per_lot, num_lots, charges } = trade
  if (!exit_price) return null
  const rawPnl = instrument === 'Call Option'
    ? (exit_price - entry_price) * qty_per_lot * num_lots
    : (entry_price - exit_price) * qty_per_lot * num_lots
  return rawPnl - (charges || 0)
}

export function fmtNum(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function fmtPct(n) {
  if (n == null || isNaN(n)) return '—'
  return (n * 100).toFixed(1) + '%'
}
