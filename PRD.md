# ZKurrent — Product Requirements Document

> **ZK-Verified Autonomous LP Agent for Sui DeFi**
>
> Sui Overflow 2026 — Agentic Web + DeepBook Tracks

---

## Executive Summary

ZKurrent is a zero-knowledge verified liquidity provision agent for Sui. It screens pools across DeepBook, Turbos, and Cetus; opens and manages concentrated liquidity positions; generates ZK proofs of strategy compliance and verifiable performance; monitors fees and impermanent loss; rebalances or exits based on strategy parameters; and learns from past trade outcomes.

**One-liner**: Meridian for Sui, with ZK proofs — autonomous LP agent that screens, opens, proves, and learns.

---

## Problem Statement

### Current State

LP management on Sui is fragmented and manual:

1. **Fragmented liquidity** — pools spread across DeepBook, Turbos, and Cetus with no unified view
2. **Manual position management** — LPs must constantly monitor and rebalance ranges
3. **No unified PnL tracking** — fees and IL tracked separately per DEX
4. **No automated strategies** — all decisions require human attention
5. **No learning from history** — past trade performance doesn't inform future decisions

### Who Feels This Pain

| Persona | Pain Point |
|---------|-----------|
| **DeFi LP** | "I have SUI/USDC sitting idle. I don't know which pool gives the best yield this week." |
| **Yield farmer** | "I open a position on Cetus, then Turbos launches a better pool. I miss it." |
| **Protocol treasury** | "We have $500K in idle treasury. We need yield but can't dedicate a full-time LP manager." |
| **Agent builder** | "I want to build a yield aggregator on Sui. I need programmatic LP execution." |

---

## Solution

ZKurrent automates the full LP lifecycle:

```
SCREEN  →  DECIDE  →  EXECUTE  →  MONITOR  →  REBALANCE  →  LEARN
```

| Step | Description | On-Chain / Off-Chain |
|------|-------------|---------------------|
| **Screen** | Agent scans Sui indexer for pool metrics (TVL, volume, fees, volatility) | Off-chain (indexer query) |
| **Decide** | Rule engine selects optimal pools and price ranges based on AgentConfig | Off-chain (strategy engine) |
| **Execute** | Opens LP position via Sui Move contract calls to DeepBook/Turbos/Cetus | **On-chain** (Move + DEX SDKs) |
| **Monitor** | Real-time tracking of fees earned, IL, position health | Mixed (indexer + on-chain events) |
| **Rebalance** | Closes position when IL exceeds threshold, re-enters better pools | **On-chain** (Move) |
| **Learn** | Records outcome per pool, weights future pool selection | Off-chain (learning engine) |

---

## Core Features (Phase 1 — Sui Overflow)

### P0 — Must Have

| ID | Feature | Description | Dependencies |
|----|---------|-------------|-------------|
| F1 | **Pool Screener** | Queries Sui indexer for TVL, volume, fees, APY across DeepBook/Turbos/Cetus pools. Scores and ranks pools. | Sui indexer API |
| F2 | **Agent Config** | On-chain Move object storing strategy params: risk tolerance, target APY, max IL threshold, pool allowlist. | `agent_config.move` |
| F3 | **Position Opener** | Opens LP positions on DeepBook (limit orders), Turbos (CLMM range), or Cetus (CLMM range) via Move. | DEX SDKs |
| F4 | **Position Tracker** | On-chain PnL history per position: entry price, fees accrued, current IL, net PnL. | `position_tracker.move` |
| F5 | **Dashboard** | React frontend: pool screener table, PnL chart, active position cards, agent status indicator. | F1, F4 |
| F6 | **DeepBook Integration** | Direct orderbook liquidity provision via DeepBook V3 SDK. | DeepBook SDK |

### P1 — Should Have

| ID | Feature | Description |
|----|---------|-------------|
| F7 | **Auto-Rebalance** | Closes position when IL > threshold. Opens new position in best-scored pool. |
| F8 | **Fee Vault** | Move contract for fee collection. Agent earns configurable % of fees generated. |
| F9 | **Strategy Page** | UI to configure AgentConfig params without redeploying. |
| F10 | **ZK Strategy Proof** | ZK proof that agent actions comply with configured strategy parameters — without revealing position sizes, ranges, or exact timing to observers. |

### P2 — Nice to Have

| ID | Feature | Description |
|----|---------|-------------|
| F11 | **Learning Engine** | Simple rule-based: tracks win/loss per pool, weights future selections. |
| F12 | **Activity Feed** | SSE stream of agent actions: "Opened Turbos SUI/USDC @ range [1.2, 1.5]" |
| F13 | **LLM Layer** | Optional LLM-powered pool analysis (Claude/GPT for market commentary, not execution). |
| F14 | **ZK Performance Attestation** | Verifiable proof of cumulative PnL that third parties can verify without seeing individual trades. |

---

## Out of Scope (Phase 1)

- Multi-agent coordination
- Cross-chain LP
- Social features (leaderboard, copy-trading)
- MEV protection
- Mobile app
- Strategy marketplace
- Lending/borrowing integration

---

## User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US1 | As a DeFi LP, I deposit SUI/USDC and ZKurrent opens the best available LP position. | Agent opens position within 60 seconds of deposit. Position visible on Dashboard. |
| US2 | As a yield farmer, I configure my risk tolerance (max IL) and ZKurrent respects it. | Agent closes position when IL > configured threshold. |
| US3 | As a treasury manager, I view cumulative PnL across all positions. | Dashboard shows total fees earned, total IL, net PnL across all pools. |
| US4 | As a developer, I deploy ZKurrent's Move contracts to my own Sui address. | Contracts are open-source, deployable via `sui client publish`. |

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     React Dashboard                          │
│  Packages: react, vite, tailwindcss, framer-motion,         │
│            zustand, recharts, @mysten/dapp-kit              │
│  Pages: Dashboard, Pools, Positions, Strategy               │
│  State: Zustand store + SSE stream for agent events         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST + SSE
┌──────────────────────────┴──────────────────────────────────┐
│                     Off-Chain Agent                          │
│  Runtime: Node.js 22+ / TypeScript                          │
│  Packages: @mysten/sui, @deepbook/sdk, turbos-sdk,          │
│            cetus-sdk, node-cron, winston                     │
│  Modules:                                                    │
│    pool-screener.ts   — Indexer queries + pool scoring       │
│    position-manager.ts — Open/close/rebalance logic          │
│    learning-engine.ts — Historical win/loss tracking         │
│    deepbook.ts        — DeepBook V3 SDK wrapper              │
│    cetus.ts           — Cetus CLMM SDK wrapper               │
│    turbos.ts          — Turbos CLMM SDK wrapper              │
│    config.ts          — Env vars, agent params               │
└──────────────────────────┬──────────────────────────────────┘
                           │ Sui SDK + DEX SDKs
┌──────────────────────────┴──────────────────────────────────┐
│                     Sui Blockchain                           │
│  Move Contracts:                                              │
│    agent_config.move      — Strategy params (Move object)     │
│    position_tracker.move  — PnL history (Move object)        │
│    fee_vault.move         — Fee collection (Move object)     │
│    zk_prover.move         — Groth16 verifier (sui::groth16)  │
│  Protocols:                                                   │
│    DeepBook V3  — On-chain orderbook                         │
│    Turbos       — Concentrated liquidity AMM                  │
│    Cetus        — Concentrated liquidity AMM                  │
│  ZK Layer (Phase 1 — Sui-native):                             │
│    sui::groth16 — On-chain proof verification                │
│    Noir circuit — Strategy compliance + config integrity      │
│  ZK Layer (Phase 2 — Midnight cross-chain):                   │
│    Midnight Compact — Private ZK attestation storage          │
│    Midnight→Sui bridge — Verified proof relay                │
└─────────────────────────────────────────────────────────────┘
```

### Agent Loop Detail

```
                     ┌─────────────────┐
                     │   CRON / Timer   │
                     │  (configurable   │
                     │   interval)      │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ 1. SCREEN POOLS │
                     │  Query indexer   │
                     │  Score & rank    │
                     └────────┬────────┘
                              │
                     ┌───────▼────────┐
                     │ Has existing   │
                     │ positions?     │
                     └───┬────────┬───┘
                     NO  │        │  YES
                         ▼        ▼
              ┌──────────┐  ┌──────────────┐
              │2a. OPEN  │  │2b. MONITOR   │
              │ Pick top │  │ Check IL vs   │
              │ pool,    │  │ threshold     │
              │ open     │  └──────┬───────┘
              │ position │         │
              └────┬─────┘    ┌───▼──────────┐
                   │          │ IL > limit?   │
                   │          └───┬────────┬──┘
                   │          NO  │        │  YES
                   │              ▼        ▼
                   │    ┌──────────┐  ┌──────────┐
                   │    │ Continue │  │3. CLOSE  │
                   │    │ Monitor  │  │ Position │
                   │    └──────────┘  └────┬─────┘
                   │                       │
                   └───────────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ 4. LEARN        │
                     │  Record outcome │
                     │  Update pool    │
                     │  weights        │
                     └─────────────────┘
```

### Data Flow

```
User deposits SUI/USDC
        │
        ▼
AgentConfig (on-chain) ← User configures strategy params
        │
        ▼
Pool Screener queries Sui indexer → ranks pools → picks best
        │
        ▼
Position Manager calls DeepBook/Turbos/Cetus SDK
        │
        ▼
Transaction signed → LP position opened on-chain
        │
        ▼
PositionTracker (on-chain) records entry price, fees, IL
        │
        ▼
Dashboard polls tracker + SSE stream for live updates
        │
        ▼
When IL > threshold → auto-close → re-scan → re-enter
        │
        ▼
Learning Engine records outcome (profit/loss per pool)
```

### SSE Event Types

| Event | Payload | Trigger |
|-------|---------|---------|
| `pool:screened` | `{ pools: PoolScore[], timestamp }` | Agent completes pool scan |
| `position:opened` | `{ pool, tokenPair, range, amount, txDigest }` | LP position created |
| `position:closed` | `{ positionId, fees, il, netPnL, txDigest }` | LP position closed |
| `position:rebalanced` | `{ oldPositionId, newPositionId, reason }` | Rebalance executed |
| `agent:heartbeat` | `{ status, activePositions, tvl, cumulativePnL }` | Every 30 seconds |
| `agent:error` | `{ code, message, context }` | Agent encounters error |

---

## Move Contracts Specification

### agent_config.move

```move
module zkurrent::agent_config {
    struct AgentConfig has key, store {
        id: UID,
        owner: address,
        risk_tolerance: u8,       // 0-100, higher = more risk
        target_apy: u64,          // basis points (e.g., 1500 = 15%)
        max_il_threshold: u64,    // basis points
        pool_allowlist: vector<u64>,  // pool IDs allowed
        pool_blocklist: vector<u64>,  // pool IDs blocked
        rebalance_interval: u64,  // seconds
        is_active: bool,
        created_at: u64,
        updated_at: u64,
    }

    public entry fun create(ctx: &mut TxContext);
    public entry fun update(config: &mut AgentConfig, ...);
    public entry fun toggle(config: &mut AgentConfig);
}
```

### position_tracker.move

```move
module zkurrent::position_tracker {
    struct PositionTracker has key, store {
        id: UID,
        owner: address,
        positions: vector<PositionRecord>,
    }

    struct PositionRecord has store, drop {
        position_id: u64,
        pool_id: u64,
        dex: u8,              // 0=DeepBook, 1=Turbos, 2=Cetus
        token_pair: String,
        amount_in: u64,
        entry_price: u64,
        exit_price: u64,
        range_low: u64,
        range_high: u64,
        fees_earned: u64,
        impermanent_loss: u64,
        net_pnl: i64,         // signed: positive=profit, negative=loss
        opened_at: u64,
        closed_at: u64,
        status: u8,           // 0=open, 1=closed, 2=rebalanced
    }
}
```

### fee_vault.move

```move
module zkurrent::fee_vault {
    struct FeeVault has key, store {
        id: UID,
        owner: address,
        collected_fees: Balance<SUI>,
        fee_rate_bps: u64,     // e.g., 100 = 1%
    }

    public entry fun deposit(vault: &mut FeeVault, coin: Coin<SUI>);
    public entry fun withdraw(vault: &mut FeeVault, amount: u64, ctx: &mut TxContext);
}
```

### zk_prover.move

```move
module zkurrent::zk_prover {
    /// ZK proof that agent actions comply with configured strategy.
    /// Verifies that a series of LP operations (open/close/rebalance)
    /// were executed within the bounds defined in AgentConfig, without
    /// revealing the actual position parameters to on-chain observers.
    struct StrategyProof has key, store {
        id: UID,
        agent_config_id: address,   // The AgentConfig this proof references
        position_count: u64,        // Number of positions covered by this proof
        proof_hash: vector<u8>,     // SHA-256 hash of the ZK proof
        verified_at: u64,           // Timestamp of verification
    }

    /// Verifies a ZK proof that the agent followed its configured strategy.
    /// Returns true if the proof is valid for the given config and positions.
    public fun verify_strategy_compliance(
        config: &AgentConfig,
        positions: &PositionTracker,
        proof: vector<u8>,
        ctx: &TxContext
    ): bool;

    /// Stores a verified proof on-chain as an immutable attestation.
    /// Used for reputation and third-party verification.
    public entry fun attest_proof(
        config: &AgentConfig,
        positions: &PositionTracker,
        proof: vector<u8>,
        ctx: &mut TxContext
    );
}
```

### ZK Circuit Design (Phase 1 — Sui-native groth16)

ZKurrent uses **Sui's native `sui::groth16` verifier** for Phase 1. The circuit is written in Noir and compiled to a Groth16 proof that is verified on-chain by `zk_prover.move`.

The circuit proves two constraints:

1. **Strategy Boundary**: For every position in `PositionTracker`, the `max_il_threshold` was not exceeded before closure
2. **Config Integrity**: The `AgentConfig` used for verification matches the one the user configured

**Public inputs** (visible on-chain):
- `config_hash` — SHA-256 of the AgentConfig at time of verification
- `position_count` — number of positions covered
- `proof_hash` — SHA-256 of the Groth16 proof

**Private witnesses** (never leave the agent):
- Actual position parameters (ranges, amounts, entry/exit prices)
- Specific pool selections and timing
- Fee accrual details

### Why Sui-native ZK (Not Midnight) for Phase 1

| Factor | Sui-native (`sui::groth16`) | Midnight Network |
|--------|---------------------------|-----------------|
| Hackathon scope | Single chain — simpler architecture | Adds cross-chain bridge + proof relay |
| Timeline fit (29 days) | Feasible | Would consume 7-10 days on infra |
| Judge relevance | This is **Sui** Overflow | Extra chain judges don't evaluate |
| Maturity | Native Sui Move module, documented | Compact ZK circuits (you know this deeply) |
| Uniqueness | Standard | Genuinely novel (no existing Midnight↔Sui ZK bridge) |

### Phase 2: Midnight Network Integration

Post-hackathon, ZKurrent proofs will be **dual-anchored** on Midnight Network:

1. ZK attestations stored privately on Midnight (Compact ledger)
2. Midnight→Sui bridge relays verified proof hashes
3. Users get Midnight's selective disclosure: prove creditworthiness/performance to third parties without revealing strategy IP

This leverages existing Tawf ecosystem infrastructure: KREDZ (Midnight ZK circuits), MIDAS (Midnight→Base bridge), and Tawf DID (cross-chain identity).

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first position | < 60 seconds from deposit |
| Pool screening freshness | < 5 minutes stale data |
| IL threshold enforcement | < 60 seconds from breach to close |
| Dashboard load time | < 2s (LCP) |
| Agent uptime | > 99% during demo period |

---

## Risk & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| DEX SDK not available | Can't open positions | Direct Move calls as fallback |
| Indexer downtime | No pool data | Cache last-known pool data; stale > fresh but exists |
| Smart contract bug | Loss of funds | Extensive testing on testnet; audit phase 2 |
| IL exceeds expectations | User dissatisfaction | Conservative defaults; clear IL warnings in dashboard |
| Sui testnet congestion | Slow transactions | Gas price buffer; retry with backoff |

---

## Competitive Analysis

| | Toby | ZKurrent |
|---|---|---|
| Framework | ElizaOS wrapper | Native Sui Move + TypeScript |
| DEX | Cetus only | DeepBook + Turbos + Cetus |
| DeepBook | No | **Yes** |
| On-chain | API calls only | **Move contracts** |
| Learning | None | Win/loss tracking |
| Frontend | CLI | **React dashboard** |
| Status | Abandoned | Fresh build |

**Verdict**: No existing autonomous LP agent with DeepBook integration exists on Sui. ZKurrent fills a genuine gap.

---

## Appendix: Hackathon Submission Requirements

| Requirement | Status |
|------------|--------|
| Live working product | Deployed on Sui Testnet |
| Open source | GitHub public repo |
| Demo video | 3-minute walkthrough |
| README | Architecture + quickstart |
| Track selection | Agentic Web |
| Team info | Submitted via DeepSurge |
