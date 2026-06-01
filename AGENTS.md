# ZKurrent — Agent Context

## Project Identity

- **Name**: ZKurrent
- **Purpose**: ZK-verified autonomous LP platform — dual offering: turnkey agent + x402 SDK/API
- **Domain**: zkurrent.xyz
- **Hackathon**: Sui Overflow 2026 (Agentic Web + DeepBook) + Midnight Build Club (ZK DApp)
- **Stack**: Sui Move (LP contracts) + Midnight Compact (ZK circuits) + TypeScript (agent) + React 19 + Vite 8 (frontend)

---

## SDK & API Design Principles

ZKurrent's SDK is an x402-gated infrastructure layer. External agents pay per-use via SUI micropayments.

### API Versioning

```
/v1/   — Current stable (Sui Overflow)
/v2/   — Post-hackathon (multi-agent, strategy marketplace)
```

### SDK Package Structure (Phase 2)

```typescript
// @zkurrent/sdk
import { ZKurrentClient } from "@zkurrent/sdk";

const client = new ZKurrentClient({
  apiUrl: "https://api.zkurrent.xyz",
  payer: suiKeypair, // x402 payments handled automatically
});

// Screen pools (0.005 SUI)
const pools = await client.screenPools();

// Open position (0.02 SUI) — agent handles payment + execution atomically
const position = await client.openPosition({
  poolId: "deepbook-sui-usdc",
  amount: 1.0,
});

// Verify a ZK proof (0.01 SUI)
const verified = await client.verifyProof("0xproof...");
```

### Rate Limiting

| Tier | Rate | Price Per Call |
|------|------|---------------|
| Free (x402-skip demo) | 10 req/min | $0 |
| Paid (x402 verified) | 100 req/min | 0.005–0.02 SUI |

### SDK Delivery

- **npm package**: `@zkurrent/sdk` (TypeScript-first, ESM + CJS)
- **CLI tool**: `npx zkurrent init` — bootstrap an agent project
- **MCP server**: `@zkurrent/mcp` — AI agents discover ZKurrent tools via Model Context Protocol

## Tech Stack Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Contracts | **Sui Move** | DeepBook/Turbos/Cetus are Sui-native. Move's object model fits LP positions (owned objects). |
| Agent runtime | **TypeScript + Node.js 22** | Sui SDK is TypeScript-native. Shared types with frontend. No Python overhead. |
| Frontend | **React 19 + Vite 8** | Matches existing Tawf ecosystem stack. Vite for fast HMR. |
| Styling | **Tailwind CSS v4** | CSS-first config via `@theme`. No tailwind.config.js. |
| State | **Zustand 5** | Lightweight. No boilerplate. Works with SSE streams. |
| Charts | **Recharts** | Mature React charting. Line/area charts for PnL, bar charts for pool comparison. |
| Wallet | **@mysten/dapp-kit** | Official Sui wallet kit. Pre-built ConnectButton, useSuiClient, useCurrentAccount. |
| Monorepo | **pnpm + Turborepo** | Matches Lading Logic + KREDZ patterns. |
| Fonts | **Manrope** (headings/body) + **Geist Mono** (data/addresses) | Manrope from KREDZ. Geist Mono from Lading Logic. Combined for best readability + data display. |

### Why NOT

| Rejected | Reason |
|----------|--------|
| Next.js | Overkill for SPA dashboard. Vite is simpler, faster builds. |
| Python agent | Two-language overhead. Sui SDK is TypeScript-first. |
| Anchor/Solana | This is a Sui hackathon. Move is required. |
| shadcn/ui | Conflicts with KREDZ design system. Build custom `ui/` components. |
| Redux | Zustand is simpler for agent SSE streams. |
| Thirdweb/Web3Modal | @mysten/dapp-kit is the official Sui wallet kit. |

---

## Code Conventions

### Sui Move Contracts

```move
// Module naming: snake_case
module zkurrent::agent_config { ... }
module zkurrent::position_tracker { ... }
module zkurrent::fee_vault { ... }
module zkurrent::zk_prover { ... }

// Struct naming: PascalCase
struct AgentConfig has key, store { ... }
struct PositionRecord has store, drop { ... }

// Function naming: snake_case
public entry fun create_config(ctx: &mut TxContext);
public entry fun update_config(config: &mut AgentConfig, ...);

// Error codes: E_ prefix, UPPER_SNAKE_CASE
const E_NOT_OWNER: u64 = 0;
const E_POSITION_NOT_FOUND: u64 = 1;
const E_AGENT_PAUSED: u64 = 2;

// Tests: #[test] attribute, module tests/
#[test]
fun test_create_config() { ... }
#[test]
#[expected_failure(abort_code = 0)]
fun test_non_owner_update() { ... }
```

### Midnight Compact Contracts

```compact
// Contract naming: snake_case.compact
// strategy_attest.compact  — 5 constraint enforcement (IL, blocklist, allowlist, DEX ≤3, position ≤20)
// performance_proof.compact — verifiable cumulative PnL

// Circuit structuring:
//   public  = visible on ledger
//   witness = private, never leaves prover

circuit StrategyAttestation {
    public config_hash: Hash;
    public total_positions: UInt;
    public dex_counts: (UInt, UInt, UInt, UInt);
    public any_pool_blocked: Bool;
    public any_pool_not_allowed: Bool;

    witness positions: Array<{
        pool_id: Hash, dex_index: UInt,
        range_low: Price, range_high: Price,
        entry_price: Price, amount: Amount,
        il_breached: Bool,
    }>;

    // Constraint 1: IL threshold
    constraint forall p in positions: p.il_breached == false;
    // Constraint 2: No blocked pools
    constraint any_pool_blocked == false;
    // Constraint 3: All pools allowlisted
    constraint any_pool_not_allowed == false;
    // Constraint 4: DEX diversification (max 3 per DEX)
    constraint dex_counts[0] <= 3;
    constraint dex_counts[1] <= 3;
    constraint dex_counts[2] <= 3;
    constraint dex_counts[3] <= 3;
    // Constraint 5: Position limit (max 20)
    constraint total_positions <= 20;
}
```

### TypeScript (agent + frontend)

```typescript
// Strict mode always
// tsconfig.json: "strict": true, "noUncheckedIndexedAccess": true

// Named exports over default exports
export function screenPools(): Promise<PoolScore[]> { ... }
export class PositionManager { ... }

// Type-first: no 'any'
type PoolScore = {
  poolId: string;
  dex: 'deepbook' | 'turbos' | 'cetus' | 'cetus_dlmm';
  tokenPair: string;
  tvl: number;
  volume24h: number;
  apy: number;
  score: number;
};

// Async/await over raw Promise chains
async function main() {
  const pools = await screenPools();
  const best = selectBestPool(pools);
  await openPosition(best);
}

// Error handling: typed errors, never throw raw strings
class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
  }
}
```

### React Components

```tsx
// Functional components only. No classes.
// Named exports.
export function PositionCard({ position }: PositionCardProps) { ... }

// Props interface always defined
interface PositionCardProps {
  position: PositionRecord;
  onClose?: (id: string) => void;
}

// Hooks at top, early returns for loading/error states
export function Dashboard() {
  const { data, isLoading, error } = useAgentStatus();

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <DashboardContent data={data} />;
}

// Event handlers: handleXxx naming
const handleClosePosition = useCallback((positionId: string) => { ... }, []);
```

### CSS (Tailwind v4)

```css
/* index.css — @theme block for design tokens */
@import "tailwindcss";

@theme {
  --color-bg: #000000;
  --color-card: #101010;
  --color-card-hover: #151515;
  --color-sui: #4DA2FF;
  --color-sui-hover: #0072E5;
  --color-profit: #2DD4BF;
  --color-loss: #FF6B6B;
  --color-deepbook: #6C5CE7;
  --color-text: rgba(225, 224, 204, 0.9);
  --color-text-muted: rgba(225, 224, 204, 0.5);
  --color-glass: rgba(30, 30, 30, 0.8);
  --color-glass-border: rgba(222, 219, 200, 0.08);

  --font-manrope: 'Manrope', sans-serif;
  --font-mono: 'Geist Mono', monospace;

  --radius-card: 1.5rem;     /* rounded-3xl equivalent */
}

/* Rules:
   - NO inline styles (style={{}})
   - NO hardcoded hex colors in components — use @theme tokens
   - NO bare Tailwind color names (bg-blue-500) — use @theme tokens
   - NO border: 1px solid anywhere — use ghost borders or surface shifts
   - Use .glass utility for navbar/modals only
   - Use .text-gradient class for key metrics only
*/
```

---

## Design Rules

These are enforced across all components. Full spec in `DESIGN_GUIDELINES.md`.

| Rule | Description |
|------|-------------|
| **No-Line Rule** | Never use `border: 1px solid`. Use background shifts (`bg-card` → `bg-card-hover`) or ghost borders (`outline: 1px solid rgba(...)`) |
| **Surface Hierarchy** | `bg-black` (page) → `bg-[#101010]` (card) → `bg-[#151515]` (hover) |
| **Glass Morphism** | `.glass` = `rgba(30,30,30,0.8)` + `blur(12px)` + `border rgba(222,219,200,0.08)`. Navbar only. |
| **Card Radius** | `rounded-3xl` (1.5rem). Consistent across all cards. |
| **Button Shape** | `rounded-full`. CTA = `bg-sui text-white px-6 py-3`. Secondary = `bg-[#1A1A1A] border border-text/5 px-5 py-2`. |
| **Typography** | Manrope (headings 500-800 weight, body 400). Geist Mono for pool IDs, addresses, data tables. |
| **Text Gradient** | `#4DA2FF → #2DD4BF` on `font-black` (800 weight) only. Used for PnL totals and key metrics. |
| **Animation Curve** | `cubic-bezier(0.16, 1, 0.3, 1)` for all framer-motion. 0.4s page transitions, 1.5s SVG ring fills. |
| **Data Display** | Numbers: compact notation for >1000. APY: percentage with 1 decimal. TVL/Volume: compact with $ prefix. |

---

## Component Patterns

### Button Variants

```tsx
// Primary CTA
<button className="rounded-full bg-sui hover:bg-sui-hover text-white font-medium px-6 py-3 transition-colors">
  Open Position
</button>

// Secondary
<button className="rounded-full bg-[#1A1A1A] border border-text/5 text-text-muted font-medium text-xs px-5 py-2 transition-colors hover:bg-card-hover">
  Configure
</button>

// Disabled
<button className="rounded-full bg-sui text-white font-medium px-6 py-3 opacity-50 cursor-not-allowed" disabled>
  Agent Paused
</button>
```

### Card Pattern

```tsx
<div className="bg-card hover:bg-card-hover rounded-3xl p-8 border border-text/5 transition-colors">
  <h3 className="text-lg font-semibold text-text">Card Title</h3>
  <p className="text-sm text-text-muted mt-2">Description</p>
</div>
```

### Metric Card

```tsx
<div className="bg-card rounded-3xl p-6 border border-text/5">
  <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
    Total PnL
  </span>
  <p className="text-4xl font-black text-gradient mt-2">
    +$4,250.50
  </p>
</div>
```

---

## Agent Architecture

### Main Loop (index.ts)

```typescript
// Polling loop: configurable interval, default 5 minutes
const INTERVAL_MS = process.env.AGENT_INTERVAL_MS ?? 300_000;

async function agentLoop() {
  const config = await loadAgentConfig();        // on-chain read
  if (!config.is_active) return;                 // paused

  const pools = await screenPools();             // indexer query
  const existing = await getOpenPositions();     // on-chain read

  if (existing.length > 0) {
    for (const pos of existing) {
      const il = await calculateIL(pos);
      if (il > config.max_il_threshold) {
        await closePosition(pos);
        const best = selectBestPool(pools, config);
        await openPosition(best, config);
        recordRebalance(pos, best);
      }
    }
  } else {
    const best = selectBestPool(pools, config);
    await openPosition(best, config);
  }

  updatePoolWeights(pools);                      // learning engine
}

setInterval(agentLoop, INTERVAL_MS);
```

### Error Handling

```typescript
// Retry with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw new AgentError('MAX_RETRIES', 'All retries exhausted');
}

// Never crash the agent loop
async function safeAgentLoop() {
  try {
    await agentLoop();
    emitHeartbeat({ status: 'healthy' });
  } catch (err) {
    emitHeartbeat({ status: 'error', error: err });
    logger.error('Agent loop failed', err);
  }
}
```

---

## Git Workflow

### Branch Naming

```
feat/pool-screener     — New features
fix/il-calculation     — Bug fixes
chore/update-deps      — Dependency updates
docs/readme            — Documentation
refactor/position-mgr  — Code restructuring
```

### Commit Convention

```
feat(agent): add DeepBook pool screener
fix(frontend): correct PnL percentage calculation
chore(deps): bump @mysten/sui to latest
docs(readme): add architecture diagram
refactor(contracts): extract fee logic to fee_vault.move
```

### PR Template

```markdown
## Summary
<!-- 1-2 sentences describing the change -->

## Test Plan
<!-- How was this tested? Sui testnet? Unit tests? -->

## Screenshots
<!-- For frontend changes only -->

## Checklist
- [ ] TypeScript strict mode passes
- [ ] Move tests pass (`sui move test`)
- [ ] No hardcoded hex colors in components
- [ ] No `any` types
- [ ] No 1px solid borders
```

---

## Environment Variables

```bash
# agent/.env
SUI_PRIVATE_KEY=suiprivkey...
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
AGENT_INTERVAL_MS=300000
DEEPBOOK_PACKAGE_ID=0x...
TURBOS_PACKAGE_ID=0x...
CETUS_PACKAGE_ID=0x...
FEE_RATE_BPS=100
LOG_LEVEL=info
```

---

## Testing Strategy

| Layer | Framework | Scope |
|-------|-----------|-------|
| Move contracts | `sui move test` | Unit tests for all entry functions |
| Agent logic | Vitest | Unit tests for pool scoring, IL calculation, position selection |
| Frontend | Vitest + Testing Library | Component rendering, hook behavior |
| Integration | Manual on testnet | End-to-end: deposit → open → monitor → close |
