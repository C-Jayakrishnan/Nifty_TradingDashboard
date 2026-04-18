import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// ─── Trade Log Sync ───────────────────────────────────────────────────────────
export function useTrades() {
  const { user } = useAuth()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchTrades = useCallback(async () => {
    if (!user) { setTrades([]); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setTrades(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const addTrade = async (trade) => {
    if (!user) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('trades')
      .insert([{ ...trade, user_id: user.id, created_at: new Date().toISOString() }])
      .select()
    if (!error) setTrades(prev => [data[0], ...prev])
    return { data, error }
  }

  const deleteTrade = async (id) => {
    if (!user) return
    await supabase.from('trades').delete().eq('id', id).eq('user_id', user.id)
    setTrades(prev => prev.filter(t => t.id !== id))
  }

  const clearAllTrades = async () => {
    if (!user) return
    await supabase.from('trades').delete().eq('user_id', user.id)
    setTrades([])
  }

  return { trades, loading, addTrade, deleteTrade, clearAllTrades, refetch: fetchTrades }
}

// ─── Session Cache Sync (prev OHLC inputs) ───────────────────────────────────
export function useSessionCache() {
  const { user } = useAuth()
  const LOCAL_KEY = 'nifty_session_cache'

  const [cache, setCache] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') }
    catch { return {} }
  })

  // Load from Supabase on login
  useEffect(() => {
    if (!user) return
    supabase.from('session_cache').select('data').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data?.data) {
          setCache(data.data)
          localStorage.setItem(LOCAL_KEY, JSON.stringify(data.data))
        }
      })
  }, [user])

  const saveCache = useCallback(async (newCache) => {
    setCache(newCache)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newCache))
    if (!user) return
    await supabase.from('session_cache').upsert({
      user_id: user.id, data: newCache, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  }, [user])

  return { cache, saveCache }
}

// ─── Stats Sync (backtest outputs) ───────────────────────────────────────────
export function useStats() {
  const { user } = useAuth()
  const LOCAL_KEY = 'nifty_stats'

  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null') }
    catch { return null }
  })
  const [loading, setLoading] = useState(false)

  // Load from Supabase on login (prefer remote over local)
  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase.from('backtest_stats').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data?.stats) {
          setStats(data.stats)
          localStorage.setItem(LOCAL_KEY, JSON.stringify(data.stats))
        }
        setLoading(false)
      })
  }, [user])

  const saveStats = useCallback(async (newStats) => {
    setStats(newStats)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newStats))
    if (!user) return
    await supabase.from('backtest_stats').upsert({
      user_id: user.id,
      stats: newStats,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  }, [user])

  const clearStats = async () => {
    setStats(null)
    localStorage.removeItem(LOCAL_KEY)
    if (!user) return
    await supabase.from('backtest_stats').delete().eq('user_id', user.id)
  }

  return { stats, loading, saveStats, clearStats }
}
