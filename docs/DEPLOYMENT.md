# NIFTY Edge — Deployment Guide

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Hosting | Cloudflare Pages (free) |
| Auth + DB | Supabase (free tier) |
| Backtest compute | Local Python (backtest_nifty.py) |

---

## Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **anon public key** (Settings → API)
3. Open **SQL Editor** → paste and run `supabase/schema.sql`
4. Enable auth providers:
   - **Authentication → Providers → Email** — enable
   - **Authentication → Providers → Google** — enable (needs Google OAuth credentials)
5. Set **Site URL** under Authentication → URL Configuration:
   - Development: `http://localhost:3000`
   - Production: `https://your-app.pages.dev`
   - Add both to **Redirect URLs** list

---

## Step 2 — Local Development

```bash
# Copy env template
cp .env.example .env.local

# Edit .env.local — fill in your Supabase credentials
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_DEV_PASSWORD=your-secret-passphrase

# Install and run
npm install
npm run dev
# → http://localhost:3000
```

---

## Step 3 — Cloudflare Pages Deployment

### Option A: GitHub (recommended — auto-deploys on push)

1. Push this repo to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) → Create application → Connect to Git
3. Select your repo
4. Configure:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Under **Environment Variables** add:
   ```
   VITE_SUPABASE_URL       = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY  = eyJhbG...
   VITE_DEV_PASSWORD       = your-secret-passphrase
   ```
6. Click Deploy — you'll get `https://your-app.pages.dev`

### Option B: Direct CLI deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name nifty-edge
```

---

## Step 4 — Backtest Workflow

The backtest runs **locally** in Python. The output CSVs are uploaded via the Developer tab.

```bash
# Run the backtest on your NIFTY data
python backtest_nifty.py

# This produces in data/:
#   candle_state_stats.csv
#   open_context_stats.csv
#   gap_stats.csv
#   level_game_stats.csv
#   thresholds.json
```

Then in the app:
1. Open **Developer** tab (bottom nav / sidebar)
2. Enter the passphrase (default: `nifty-dev-2024`)
3. Upload all 4 CSV files
4. Click **Save & Sync** → stats are saved to Supabase and available on all your devices instantly

---

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `trades` | Per-user trade log. Full CRUD with RLS. |
| `session_cache` | Saved OHLC inputs per user. Syncs across devices. |
| `backtest_stats` | Backtest output stored as JSONB. Shared per user. |

All tables have **Row Level Security** — users can only see their own data.

---

## Developer Tab Passphrase

The passphrase is set via `VITE_DEV_PASSWORD` env variable.
- Default (if not set): `nifty-dev-2024`
- **Change this** before deploying to production
- No user account needed — anyone with the passphrase can upload stats

---

## Updating Stats (re-running backtest)

Just re-upload the CSVs via the Developer tab. The new stats will overwrite the old ones in Supabase and sync to all devices within seconds.

---

## Mobile Usage

The app is fully responsive:
- **Mobile**: Bottom navigation bar (Edge · Browse · Log Trade · Insights · Dev)
- **Desktop**: Left sidebar navigation
- All inputs and charts are touch-friendly

---

## Folder Structure

```
nifty-edge/
├── src/
│   ├── pages/
│   │   ├── WelcomePage.jsx      # Main edge detection (CPR + games)
│   │   ├── EdgeDetectionPage.jsx # Browse all stats
│   │   ├── TradeLoggingPage.jsx  # Log trades
│   │   ├── InsightPage.jsx       # P&L analytics
│   │   ├── DeveloperPage.jsx     # Upload backtest CSVs
│   │   └── AuthPage.jsx          # Login / signup
│   ├── components/
│   │   └── Charts.jsx            # Gauge, ProbRow, CPRDisplay, etc.
│   ├── hooks/
│   │   ├── useAuth.jsx           # Supabase auth context
│   │   └── useData.js            # Trades + session + stats sync
│   ├── lib/
│   │   └── supabase.js           # Supabase client
│   ├── utils/
│   │   └── calculations.js       # CPR, candle state, backtest engine
│   ├── App.jsx                   # Layout + routing
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Design system (CSS variables)
├── supabase/
│   └── schema.sql                # Run once in Supabase SQL Editor
├── public/
│   └── _redirects                # Cloudflare Pages SPA routing
├── .env.example                  # Env template
└── docs/
    └── DEPLOYMENT.md             # This file
```
