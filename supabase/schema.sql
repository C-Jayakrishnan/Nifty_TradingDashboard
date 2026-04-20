-- ============================================================
-- NIFTY EDGE — Supabase Schema
-- Run this once in your Supabase project → SQL Editor
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── 1. Trades table ─────────────────────────────────────────
create table if not exists public.trades (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  trade_date      date,
  edge_type       text,
  market_direction text,
  harmony         text,
  pre_trade_data_flag text,
  instrument      text,
  entry_price     numeric,
  stop_loss       numeric,
  num_lots        integer,
  qty_per_lot     integer,
  risk_amount     numeric,
  exit_price      numeric,
  charges         numeric,
  exit_reason     text,
  created_at      timestamptz default now()
);

-- Row-level security: users can only see their own trades
alter table public.trades enable row level security;

create policy "trades_select" on public.trades
  for select using (auth.uid() = user_id);

create policy "trades_insert" on public.trades
  for insert with check (auth.uid() = user_id);

create policy "trades_delete" on public.trades
  for delete using (auth.uid() = user_id);

create policy "trades_update" on public.trades
  for update using (auth.uid() = user_id);

-- ─── 2. Session cache table ───────────────────────────────────
create table if not exists public.session_cache (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  data        jsonb,
  updated_at  timestamptz default now()
);

alter table public.session_cache enable row level security;

create policy "session_cache_all" on public.session_cache
  for all using (auth.uid() = user_id);

-- ─── 3. Backtest stats table ──────────────────────────────────
-- Stats are stored as a single JSONB blob per user.
-- The Developer tab uploads to this table.
create table if not exists public.backtest_stats (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  stats       jsonb,
  updated_at  timestamptz default now()
);

alter table public.backtest_stats enable row level security;

create policy "backtest_stats_all" on public.backtest_stats
  for all using (auth.uid() = user_id);

-- ─── 4. Indexes ───────────────────────────────────────────────
create index if not exists trades_user_id_idx on public.trades(user_id);
create index if not exists trades_date_idx on public.trades(trade_date desc);

-- ─── Done ─────────────────────────────────────────────────────
-- Now configure auth providers in Supabase Dashboard:
--   Authentication → Providers → Enable Email + Google
--   Authentication → URL Configuration → set Site URL to your Cloudflare Pages domain
