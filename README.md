# ZKurrent — ZK-Verified Autonomous LP Agent on Sui + Midnight

> **Screen pools. Open positions. Prove performance. Autonomously.**

ZKurrent is a zero-knowledge verified liquidity provision agent. LP execution runs on Sui (DeepBook, Turbos, Cetus). ZK attestations live on Midnight Network (Compact circuits with private state). One agent, two chains, verifiable performance.

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
git clone https://github.com/tawf-labs/zkurrent.git
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
├── AGENTS.md
├── DESIGN_GUIDELINES.md
├── contracts/
│   └── zkurrent/
│       ├── Move.toml
│       └── sources/
│           ├── agent_config.move
│           ├── position_tracker.move
│           └── fee_vault.move
├── agent/
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── pool-screener.ts
│   │   ├── position-manager.ts
│   │   ├── learning-engine.ts
│   │   ├── deepbook.ts
│   │   ├── cetus.ts
│   │   ├── turbos.ts
│   │   └── config.ts
│   └── .env.example
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   ├── layout/
│       │   ├── pages/
│       │   ├── sections/
│       │   └── ui/
│       ├── hooks/
│       ├── stores/
│       └── utils/
├── docs/
│   └── architecture.md
├── package.json
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

## Tracks

| Track | How ZKurrent Qualifies |
|-------|----------------------|
| **Agentic Web** (Core, $30K 1st) | Autonomous AI agent: screens pools, opens positions, rebalances across 3 DEXes |
| **DeepBook** (Specialized, $70K pool) | Direct DeepBook V3 integration for orderbook liquidity |
| **Midnight ZK** (Cross-chain bonus) | ZK attestations on Midnight Compact: private proofs of strategy compliance + verifiable PnL |

### Dual Hackathon Eligibility

| Hackathon | What | Chain |
|-----------|------|-------|
| **Sui Overflow** | LP agent: Move contracts, off-chain agent, React dashboard | Sui |
| **Midnight Build Club** | ZK DApp: `strategy_attest.compact` + `performance_proof.compact` + 1AM frontend | Midnight |

---

## Competitive Landscape

| | Toby (LP-AI-Agent) | ZKurrent |
|---|---|---|
| Framework | ElizaOS plugin wrapper | Native Sui Move + TypeScript agent |
| DEX support | Cetus only | Cetus + Turbos + **DeepBook** |
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

Apache 2.0
