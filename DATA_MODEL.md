# ZKurrent — Unified Data Layer

> All agent decisions, position tracking, learning, and ZK proof verification flow through this data model. Every object has a defined type, every relationship is explicit, every action has a clear input/output contract.

---

## Object Types

### 1. Pool Metrics

Immutable snapshot of a DEX pool at a point in time. Each screening cycle writes a new row.

| Field | Type | Description |
|-------|------|-------------|
| `id` | BIGSERIAL | Auto-increment key |
| `pool_id` | TEXT | DEX-specific pool identifier |
| `dex` | ENUM | `deepbook`, `turbos`, `cetus`, `cetus_dlmm` |
| `token_pair` | TEXT | e.g. `SUI/USDC` |
| `tvl` | DOUBLE | Total value locked in USD |
| `volume_24h` | DOUBLE | 24-hour trading volume |
| `apy` | DOUBLE | Annualized percentage yield |
| `fees_24h` | DOUBLE | 24-hour fee generation |
| `score` | INTEGER | 0--100 composite (volume + APY + TVL) |
| `rank` | INTEGER | Position in this scanning cycle |
| `scanned_at` | TIMESTAMPTZ | When this snapshot was taken |

**Links**: Referenced by `positions.pool_id` and `learning_data.pool_id`.

### 2. Positions

An LP position opened, monitored, and eventually closed by the agent.

| Field | Type | Description |
|-------|------|-------------|
| `position_id` | TEXT UNIQUE | DEX-format position identifier |
| `pool_id` | TEXT → pool_metrics.pool_id | Which pool this position is on |
| `dex` | ENUM | Same ENUM as pool_metrics |
| `token_pair` | TEXT | Redundant denormalization for fast reads |
| `amount_in` | DOUBLE | Deposit amount |
| `amount_in_usd` | DOUBLE | USD value at entry |
| `entry_price` | DOUBLE | Price when position was opened |
| `current_price` | DOUBLE? | Price at last check |
| `exit_price` | DOUBLE? | Price when closed |
| `range_low` | DOUBLE | Lower bound (CLMM range or DLMM lowest bin) |
| `range_high` | DOUBLE | Upper bound |
| `fees_earned` | DOUBLE | Accumulated fees since open |
| `impermanent_loss` | DOUBLE | Estimated IL at current price |
| `net_pnl` | DOUBLE | `fees_earned - impermanent_loss` |
| `status` | ENUM | `open`, `closed`, `rebalanced` |
| `opened_at` | TIMESTAMPTZ | When the position was created |
| `closed_at` | TIMESTAMPTZ? | When closed |
| `tx_digest` | TEXT? | Sui transaction digest |

**Links**: Self-referencing via pool_id → pool_metrics. Foreign key to learning_data when closed.

### 3. Agent Events

Realtime event stream. Powers the dashboard activity feed via Supabase Realtime.

| Field | Type | Description |
|-------|------|-------------|
| `event_type` | TEXT | `pool:screened`, `position:opened`, `position:closed`, `agent:heartbeat`, etc. |
| `payload` | JSONB | Full typed event (validated by Zod in `types.ts`) |
| `created_at` | TIMESTAMPTZ | When emitted |

**Links**: No foreign keys. Consumed by the frontend via Supabase Realtime channel.

### 4. Learning Data

Cycle outcomes. The agent's memory. Every decision + result is recorded here.

| Field | Type | Description |
|-------|------|-------------|
| `cycle_id` | TEXT UNIQUE | UUID per agent cycle |
| `action` | ENUM | `open`, `close`, `rebalance`, `hold`, `skip` |
| `pool_id` | TEXT? | Which pool was acted on |
| `dex` | ENUM? | Which DEX |
| `fees_earned` | DOUBLE | Fees from this cycle |
| `impermanent_loss` | DOUBLE | IL from this cycle |
| `net_pnl` | DOUBLE | Net result |
| `started_at` | TIMESTAMPTZ | Cycle start |
| `completed_at` | TIMESTAMPTZ | Cycle end |

**Links**: Referenced by `decide.ts` for win/loss history per pool.

### 5. ZK Proofs

Midnight ZK attestations relayed to Sui.

| Field | Type | Description |
|-------|------|-------------|
| `proof_id` | TEXT UNIQUE | Composite: `proof-{timestamp}-{hash}` |
| `proof_type` | ENUM | `strategy_compliance`, `performance` |
| `proof_hash` | TEXT | SHA-256 of the proof |
| `midnight_block_hash` | TEXT? | Midnight block containing the attestation |
| `sui_tx_digest` | TEXT? | Sui transaction where proof hash was verified |
| `verified_at` | TIMESTAMPTZ | When verified |

**Links**: Referenced by `midnight.ts` → Effectstream relayer → `zk_prover.move` on Sui.

### 6. Strategy Configs

User-defined agent parameters. Mirrors on-chain `AgentConfig` Move object.

| Field | Type | Description |
|-------|------|-------------|
| `owner` | TEXT | Sui address |
| `risk_tolerance` | INTEGER | 0--100 |
| `target_apy_bps` | INTEGER | e.g. 1500 = 15% |
| `max_il_threshold_bps` | INTEGER | e.g. 500 = 5% |
| `pool_allowlist` | TEXT[] | Pool IDs to include |
| `pool_blocklist` | TEXT[] | Pool IDs to exclude |
| `rebalance_interval_ms` | INTEGER | Agent loop interval |
| `is_active` | BOOLEAN | Agent on/off |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**Links**: One-to-one with on-chain `AgentConfig`. Updated on-chain first, mirrored to Supabase.

---

## Relationships

```
pool_metrics ◄── pool_id ──► positions
     │                            │
     │                            ▼
     ├── pool_id ──► learning_data
     │
     ▼
strategy_configs (independent, 1:1 with on-chain AgentConfig)
     │
     ▼
agent_events (independent, consumed by frontend via realtime)
     │
     ▼
zk_proofs (independent, linked to Midnight via midnight_block_hash)
```

---

## Key Queries

### The agent's decision-required data (one composite query)

```sql
-- 1. Top pools (last screening cycle)
SELECT * FROM pool_metrics
WHERE scanned_at = (SELECT MAX(scanned_at) FROM pool_metrics)
ORDER BY score DESC LIMIT 5;

-- 2. Active positions with PnL
SELECT * FROM positions WHERE status = 'open';

-- 3. Pool win/loss history
SELECT pool_id, COUNT(*) FILTER (WHERE net_pnl >= 0) AS wins,
       COUNT(*) FILTER (WHERE net_pnl < 0) AS losses,
       AVG(net_pnl) AS avg_pnl
FROM learning_data
WHERE pool_id IS NOT NULL
GROUP BY pool_id;

-- 4. DEX diversification
SELECT dex, COUNT(*) FROM positions WHERE status = 'open' GROUP BY dex;

-- 5. Volatility trend (compare last 2 scans)
SELECT pool_id, apy, volume_24h
FROM pool_metrics
WHERE scanned_at IN (
  SELECT DISTINCT scanned_at FROM pool_metrics ORDER BY scanned_at DESC LIMIT 2
);
```

### The dashboard's live data (realtime subscription)

```sql
-- Agent events stream (Supabase Realtime channel)
SELECT * FROM agent_events ORDER BY created_at DESC LIMIT 50;

-- Active positions (polled every 30s)
SELECT * FROM positions WHERE status = 'open';
```

---

## Type Contracts (TypeScript ↔ SQL)

Every SQL row maps to a Zod-validated TypeScript type in `agent/src/types.ts`. The schema is the source of truth — Supabase rows are validated on read and write.

```typescript
// Example: PoolMetrics maps directly to pool_metrics table
export const PoolScoreSchema = z.object({
  poolId: z.string(),        // → pool_metrics.pool_id
  dex: z.enum([...]),        // → pool_metrics.dex
  tokenPair: z.string(),     // → pool_metrics.token_pair
  tvl: z.number(),           // → pool_metrics.tvl
  // ... all fields validated at runtime
});
```

No runtime type errors between the database and the agent — Zod validates every row transition.
