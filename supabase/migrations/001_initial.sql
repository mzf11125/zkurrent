-- ZKurrent Supabase Migration v001
-- Tables for agent state, pool metrics, positions, events, learning, ZK proofs

-- ── Pool Metrics Cache ──
CREATE TABLE IF NOT EXISTS pool_metrics (
  id BIGSERIAL PRIMARY KEY,
  pool_id TEXT NOT NULL,
  dex TEXT NOT NULL CHECK (dex IN ('deepbook', 'turbos', 'cetus', 'cetus_dlmm')),
  token_pair TEXT NOT NULL,
  tvl DOUBLE PRECISION DEFAULT 0,
  volume_24h DOUBLE PRECISION DEFAULT 0,
  apy DOUBLE PRECISION DEFAULT 0,
  fees_24h DOUBLE PRECISION DEFAULT 0,
  volatility_24h DOUBLE PRECISION DEFAULT 0,
  score INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pool_id, scanned_at)
);

CREATE INDEX idx_pool_metrics_latest ON pool_metrics (scanned_at DESC, score DESC);
CREATE INDEX idx_pool_metrics_dex ON pool_metrics (dex, scanned_at DESC);

-- ── LP Positions ──
CREATE TABLE IF NOT EXISTS positions (
  id BIGSERIAL PRIMARY KEY,
  position_id TEXT UNIQUE NOT NULL,
  pool_id TEXT NOT NULL,
  dex TEXT NOT NULL CHECK (dex IN ('deepbook', 'turbos', 'cetus', 'cetus_dlmm')),
  token_pair TEXT NOT NULL,
  amount_in DOUBLE PRECISION DEFAULT 0,
  amount_in_usd DOUBLE PRECISION DEFAULT 0,
  entry_price DOUBLE PRECISION DEFAULT 0,
  current_price DOUBLE PRECISION,
  exit_price DOUBLE PRECISION,
  range_low DOUBLE PRECISION DEFAULT 0,
  range_high DOUBLE PRECISION DEFAULT 0,
  fees_earned DOUBLE PRECISION DEFAULT 0,
  impermanent_loss DOUBLE PRECISION DEFAULT 0,
  net_pnl DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'rebalanced')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  tx_digest TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_positions_status ON positions (status, opened_at DESC);
CREATE INDEX idx_positions_pool ON positions (pool_id, opened_at DESC);

-- ── Agent Events (Supabase Realtime) ──
CREATE TABLE IF NOT EXISTS agent_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_events_type ON agent_events (event_type, created_at DESC);
CREATE INDEX idx_agent_events_created ON agent_events (created_at DESC);

-- Enable real-time for agent_events
ALTER PUBLICATION supabase_realtime ADD TABLE agent_events;

-- ── Learning Data ──
CREATE TABLE IF NOT EXISTS learning_data (
  id BIGSERIAL PRIMARY KEY,
  cycle_id TEXT UNIQUE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('open', 'close', 'rebalance', 'hold', 'skip')),
  pool_id TEXT,
  dex TEXT CHECK (dex IN ('deepbook', 'turbos', 'cetus', 'cetus_dlmm')),
  fees_earned DOUBLE PRECISION DEFAULT 0,
  impermanent_loss DOUBLE PRECISION DEFAULT 0,
  net_pnl DOUBLE PRECISION DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learning_data_pool ON learning_data (pool_id, completed_at DESC);

-- ── ZK Proofs ──
CREATE TABLE IF NOT EXISTS zk_proofs (
  id BIGSERIAL PRIMARY KEY,
  proof_id TEXT UNIQUE NOT NULL,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('strategy_compliance', 'performance')),
  proof_hash TEXT NOT NULL,
  midnight_block_hash TEXT,
  sui_tx_digest TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zk_proofs_type ON zk_proofs (proof_type, verified_at DESC);

-- ── Strategy Configs ──
CREATE TABLE IF NOT EXISTS strategy_configs (
  id BIGSERIAL PRIMARY KEY,
  owner TEXT NOT NULL,
  risk_tolerance INTEGER NOT NULL DEFAULT 50 CHECK (risk_tolerance BETWEEN 0 AND 100),
  target_apy_bps INTEGER NOT NULL DEFAULT 1500,
  max_il_threshold_bps INTEGER NOT NULL DEFAULT 500,
  pool_allowlist TEXT[] DEFAULT '{}',
  pool_blocklist TEXT[] DEFAULT '{}',
  rebalance_interval_ms INTEGER NOT NULL DEFAULT 300000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_strategy_configs_owner ON strategy_configs (owner, updated_at DESC);

-- ── Trigger: auto-update updated_at ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER strategy_configs_updated_at
  BEFORE UPDATE ON strategy_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
