# ZKurrent — The Autonomous Liquidity Current

> **ZK-shielded execution for AI agents on Sui. One current. Every agent.**
>
> • **For Traders**: Deploy a turnkey autonomous LP agent that screens DeepBook, Cetus & Turbos pools, opens positions, and proves performance via Midnight ZK.
>
> • **For Builders**: x402-gated SDK & API. Other bots and agents pay fractions of a cent to route through ZKurrent's privacy-preserving execution rails. No API keys. No sign-ups. Machine-to-machine micropayments.

ZKurrent isn't one agent. It's the underlying current that routes capital, data, and privacy for every agent on the network. Covering 4 Sui DEXes: DeepBook (orderbook) · Cetus CLMM · Cetus DLMM · Turbos CLMM.

Built for [Sui Overflow 2026](https://sui.io/overflow) — Agentic Web + DeepBook tracks + Midnight cross-chain bonus.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     React Dashboard                       │
│  /dashboard  │  /pools  │  /positions  │  /strategy      │
│  (Sui dApp Kit + 1AM wallet + Supabase Realtime)        │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────┐
│              Off-Chain Agent (LangGraph)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐           │
│  │ SCREEN   │─▶│ DECIDE   │─▶│  EXECUTE     │           │
│  │ (tools)  │  │ (DeepSeek│  │  (Cetus SDK   │           │
│  │          │  │  V4 Pro) │  │   + Sui SDK)  │           │
│  └──────────┘  └──────────┘  └──────┬───────┘           │
│       ▲                             │                    │
│       │         ┌─────────┐         │                    │
│       └─────────│  LEARN  │◀────────┘                    │
│                 │(Supabase│                               │
│                 │ weights)│                               │
│                 └────┬────┘                               │
│                      │                                    │
│              ┌───────▼────────┐                          │
│              │   MONITOR      │                          │
│              │ (Supabase RT)  │                          │
│              └────────────────┘                          │
└──────┬──────────────────────┬───────────────────────────┘
       │ Sui SDK              │ Midnight SDK
       ▼                      ▼
┌──────────────┐    ┌─────────────────────────────────────┐
│  Sui (LP)    │    │   Midnight Network (ZK Attestation) │
│              │    │                                     │
│ agent_config │    │  strategy_attest.compact             │
│ pos_tracker  │    │  performance_proof.compact          │
│ fee_vault    │    │                                     │
│ zk_prover◄───┼────│── proof hash relay                  │
│              │    │  1AM Wallet · ProofStation           │
│ DeepBook     │    └──────────────────┬──────────────────┘
│ Cetus CLMM   │                       │
│ Turbos       │              ┌────────▼──────────────────┐
└──────────────┘              │   Effectstream Relayer     │
                              │                            │
                              │ @effectstream/sync         │
                              │   reads Midnight ledger    │
                              │                            │
                              │ @effectstream/batcher      │
                              │   relays proof hash → Sui  │
                              │                            │
                              │ @effectstream/orchestrator  │
                              │   local dev environment    │
                              └────────────────────────────┘
```
---

## Agent Loop

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Screen       │ ──▶ │  Open         │ ──▶ │  Monitor      │
│  Pools        │     │  Position     │     │  PnL          │
│  (on-chain)   │     │  (DeepBook/   │     │  (fees + IL)  │
│               │     │   Turbos/     │     │               │
│               │     │   Cetus)      │     │               │
└──────────────┘     └──────────────┘     └──────┬────────┘
                                                  │
      ┌───────────────────────────────────────────┘
      ▼
┌──────────────┐     ┌──────────────┐
│  Rebalance    │ ──▶ │  Learn &     │
│  / Exit       │     │  Adapt       │
│  Position     │     │  (pool       │
│               │     │   weights)   │
└──────────────┘     └──────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install)
- [Sui Wallet](https://sui.io/) (browser extension)

### Installation

```bash
git clone https://github.com/mzf11125/zkurrent.git
cd zkurrent

# Install all dependencies
pnpm install

# Copy environment config
cp agent/.env.example agent/.env
```

### Run Agent

```bash
pnpm agent:dev
```

### Run Frontend

```bash
pnpm frontend:dev
# Opens at http://localhost:5173
```

### Deploy Move Contracts

```bash
cd contracts/zkurrent
sui client publish --gas-budget 100000000
```

---

## Project Structure

```
zkurrent/
├── README.md
├── PRD.md
├── DATA_MODEL.md
├── AGENTS.md
├── DESIGN_GUIDELINES.md
├── LICENSE
├── contracts/
│   └── zkurrent/
│       ├── Move.toml
│       ├── sources/
│       │   ├── agent_config.move
│       │   ├── position_tracker.move
│       │   ├── fee_vault.move
│       │   └── zk_prover.move
│       ├── circuits/                # Midnight Compact contracts
│       └── tests/
├── agent/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts                 # Agent entrypoint + LangGraph runner
│       ├── graph.ts                 # LangGraph workflow definition
│       ├── types.ts                 # Zod-validated type schemas
│       ├── nodes/
│       │   ├── screen.ts            # Pool screening via Sui Indexer
│       │   ├── decide.ts            # LLM-powered decision (DeepSeek V4 Pro)
│       │   ├── execute.ts           # On-chain LP operations
│       │   ├── monitor.ts           # Position health monitoring
│       │   └── learn.ts             # Outcome recording + weight updates
│       ├── tools/
│       │   ├── screenPools.ts       # Unified pool screening tool
│       │   ├── openPosition.ts      # Open LP position tool
│       │   ├── closePosition.ts     # Close LP position tool
│       │   ├── getPoolHistory.ts    # Historical pool performance
│       │   └── generateZKProof.ts   # Midnight ZK proof generation
│       ├── integrations/
│       │   ├── sui.ts               # Sui SDK wrappers
│       │   ├── supabase.ts          # Supabase queries + realtime
│       │   ├── midnight.ts          # Midnight Compact + ProofStation
│       │   ├── cetus.ts             # Cetus CLMM SDK
│       │   ├── cetus-dlmm.ts        # Cetus DLMM SDK
│       │   ├── deepbook.ts          # DeepBook V3 SDK
│       │   ├── turbos.ts            # Turbos CLMM SDK
│       │   ├── pyth.ts              # Pyth on-chain price feeds
│       │   ├── sui-indexer.ts       # Whale + ecosystem event detection
│       │   └── effectstream.ts      # Cross-chain proof relay
│       ├── security/
│       │   ├── sanitize.ts          # Prompt injection defense
│       │   ├── guard.ts             # Bastion policy engine
│       │   ├── audit.ts             # Immutable decision log
│       │   └── session-guard.ts     # Circuit breaker + rate limits
│       └── api/
│           ├── server.ts            # Hono HTTP server
│           ├── middleware/
│           │   └── x402.ts          # SUI micropayment verification
│           └── routes/
│               ├── proof.ts         # ZK proof verification endpoint
│               ├── pools.ts         # Pool data endpoint
│               └── agent.ts         # Agent status endpoint
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json
│   ├── index.html
│   └── src/
│       ├── App.tsx                  # Sui wallet providers + routing
│       ├── main.tsx
│       ├── index.css                # Liquid Ledger design system
│       ├── components/
│       │   ├── WordsPullUp.tsx       # KREDZ text animation
│       │   ├── BlurIn.tsx            # KREDZ blur-in animation
│       │   ├── layout/
│       │   │   ├── Navbar.tsx        # KREDZ-style glass navbar
│       │   │   └── Layout.tsx        # Cinematic background + routing
│       │   ├── pages/
│       │   │   ├── Landing.tsx       # Marketing landing page
│       │   │   ├── Dashboard.tsx     # Agent overview + metrics
│       │   │   ├── Pools.tsx         # Pool screener table
│       │   │   ├── Positions.tsx     # Active + closed LP positions
│       │   │   └── Strategy.tsx      # Agent configuration
│       │   ├── sections/
│       │   │   ├── AgentStatusBar.tsx
│       │   │   ├── PnLChart.tsx
│       │   │   ├── PositionCard.tsx
│       │   │   ├── PoolTable.tsx
│       │   │   └── ActivityFeed.tsx
│       │   └── ui/
│       │       ├── Button.tsx
│       │       ├── Card.tsx
│       │       ├── Badge.tsx
│       │       └── MetricCard.tsx
│       ├── hooks/
│       ├── stores/
│       └── utils/
├── supabase/
│   └── migrations/
│       └── 001_initial.sql          # Full schema (6 tables + RLS)
├── package.json                     # Workspace root (pnpm)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| LP Execution | Sui Move | latest |
| ZK Attestation | Midnight Compact | — |
| Agent Framework | LangChain.js + LangGraph | ^0.3 / ^0.2 |
| LLM (optional) | DeepSeek V4 Pro (via OpenRouter) | `deepseek/deepseek-chat` |
| Data Layer | Supabase (PostgreSQL + Realtime) | ^2.49 |
| Pool Screening | @cetusprotocol/sui-clmm-sdk | ^1.4 |
| DEX Integration | DeepBook V3 + Cetus CLMM + Turbos | — |
| Frontend | React 19 + Vite 8 + Tailwind CSS v4 | latest |
| Animation | Framer Motion | 12+ |
| Icons | Lucide React | latest |
| State | Zustand | 5+ |
| Charts | Recharts | 2+ |
| Sui Wallet | @mysten/dapp-kit | latest |
| Midnight Wallet | 1AM (browser extension) | — |
| Fonts | Manrope + Geist Mono | — |

---

## Security — Bastion Agentic Defense

ZKurrent inherits Bastion's ERC-7579 per-agent policy engine with 4 defense layers:

| Layer | Purpose | Where |
|-------|---------|-------|
| 1. **Input Sanitization** | Strips prompt injection vectors from pool names, token pairs, whale events | `security/sanitize.ts` |
| 2. **Guard Policy** | Validates every LLM output against 7 hardware constraints (action allowlist, pool blocklist, IL bounds, DEX ≤3, position limit, consecutive opens, circuit breaker) | `security/guard.ts` |
| 3. **ZK Circuit** | Authoritative cryptographic enforcement on Midnight — 5 constraints in `strategy_attest.compact` that cannot be bypassed (proof generation fails if violated) | Midnight Compact |
| 4. **Decision Log** | Immutable append-only audit trail — every prompt hash, LLM response, guard result, and Sui transaction recorded with RLS | `security/audit.ts` + Supabase `decision_log` |

---

## Tracks

| Track | How ZKurrent Qualifies |
|-------|----------------------|
| **Agentic Web** (Core, $30K 1st) | Autonomous AI agent: screens pools, opens positions, rebalances across 4 DEX types |
| **DeepBook** (Specialized, $70K pool) | Direct DeepBook V3 integration for orderbook liquidity + x402 M2M payment economy |
| **Midnight ZK** (Cross-chain bonus) | ZK attestations on Midnight Compact: private proofs of strategy compliance + verifiable PnL |

### Dual-Offering Model

| Offering | Target | Monetization |
|----------|--------|-------------|
| **ZKurrent App** — Turnkey LP agent | Retail LPs, DAOs, protocol treasuries | Free (open source) + fee_vault % on fees generated |
| **ZKurrent SDK & API** — x402 M2M rails | External developers, AI agents, trading bots | Pay-per-use x402 micropayments in SUI (0.005–0.02 SUI per call) |

### Dual Hackathon Eligibility

| Hackathon | What | Chain |
|-----------|------|-------|
| **Sui Overflow** | LP agent (Move contracts, LangGraph agent, React dashboard) + x402 API | Sui |
| **Midnight Build Club** | ZK DApp: Compact circuits for private strategy + performance proofs | Midnight |

---

## Competitive Landscape

| | Toby (LP-AI-Agent) | ZKurrent |
|---|---|---|
| Framework | ElizaOS plugin wrapper | Native Sui Move + TypeScript agent |
| DEX support | Cetus only | Cetus CLMM + Cetus DLMM + Turbos + **DeepBook** |
| DeepBook | No | **Yes** |
| On-chain logic | None (API-only) | **Move contracts** |
| ZK proofs | No | **Yes** — strategy compliance + performance |
| Learning | None | Win/loss tracking + pool weighting |
| Frontend | Eliza CLI | **React dashboard** |
| Status | Abandoned (Feb 2025) | Fresh build |

---

## Roadmap

| Phase | Timeline | Features |
|-------|----------|----------|
| **Phase 1** (Sui Overflow) | 29 days | Pool screener, position manager, Move contracts (agent_config + position_tracker + zk_prover), dashboard, DeepBook integration, ZK strategy proofs |
| **Phase 2** | Post-hackathon | LLM-powered decision layer, multi-agent coordination, MEV protection, ZK performance attestation marketplace |
| **Phase 3** | Q3 2026 | Social strategies, leaderboard, strategy marketplace, mobile app |

---

## Brand

- **Name**: ZKurrent
- **Domain**: zkurrent.xyz
- **Logo**: Stylized "ZK" monogram with wave-current motif, Sui blue gradient, ZK shield accent
- **Design System**: "Liquid Ledger" — dark cinematic minimalism with Sui blue + ZK purple accents

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full text.
