import { ChatOpenAI } from "@langchain/openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentState, AgentAction, PoolScore, AgentConfig } from "../types.js";
import { getPoolPerformance } from "../integrations/supabase.js";

import "dotenv/config";

const DEFAULT_CONFIG: AgentConfig = {
  owner: "agent",
  riskTolerance: 50,
  targetApyBps: 1500,
  maxIlThresholdBps: 500,
  poolAllowlist: [],
  poolBlocklist: [],
  rebalanceIntervalMs: 300_000,
  isActive: true,
  updatedAt: new Date().toISOString(),
};

export async function decideNode(
  state: typeof AgentState.State,
  config?: { configurable?: { supabase?: SupabaseClient } }
): Promise<Partial<typeof AgentState.State>> {
  const agentConfig = state.config ?? DEFAULT_CONFIG;
  const supabase = config?.configurable?.supabase;

  if (state.activePositions.length > 0) {
    return handleExistingPositions(state, agentConfig);
  }

  return handleOpenNew(state, agentConfig, supabase);
}

async function handleExistingPositions(
  state: typeof AgentState.State,
  config: AgentConfig
): Promise<Partial<typeof AgentState.State>> {
  for (const pos of state.activePositions) {
    if (pos.impermanentLoss > config.maxIlThresholdBps) {
      return {
        cycleStatus: "executing",
        selectedAction: "close",
        targetPosition: pos,
        lastError: null,
      };
    }
  }

  return {
    cycleStatus: "monitoring",
    selectedAction: "hold",
    lastError: null,
  };
}

async function handleOpenNew(
  state: typeof AgentState.State,
  config: AgentConfig,
  supabase?: SupabaseClient
): Promise<Partial<typeof AgentState.State>> {
  const eligible = state.screenedPools.filter(
    (p) =>
      p.apy >= config.targetApyBps / 100 &&
      !config.poolBlocklist.includes(p.poolId)
  );

  if (eligible.length === 0) {
    return {
      cycleStatus: "idle",
      selectedAction: "skip",
      lastError: "No eligible pools above target APY",
    };
  }

  // Boost scores with historical performance
  let best = eligible[0]!;
  let bestScore = best.score;

  if (supabase) {
    for (const pool of eligible.slice(0, 5)) {
      try {
        const perf = await getPoolPerformance(supabase, pool.poolId);
        const winRate = perf.wins + perf.losses > 0
          ? perf.wins / (perf.wins + perf.losses)
          : 0.5;
        const adjustedScore = pool.score * (0.7 + 0.3 * winRate);
        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          best = pool;
        }
      } catch {
        // skip pool if performance fetch fails
      }
    }
  }

  return {
    cycleStatus: "executing",
    selectedAction: "open",
    selectedPool: best,
    lastError: null,
  };
}

// ── LLM-Enhanced Decision (DeepSeek V4 Pro) ──

import { createSuiClient } from "../integrations/sui.js";
import { getMarketPrices, getDerivedPairs } from "../integrations/pyth.js";
import { getOnChainContext } from "../integrations/sui-indexer.js";
import { getPoolPerformance } from "../integrations/supabase.js";

export async function decideNodeWithLLM(
  state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State>> {
  const { client: suiClient } = createSuiClient();

  // ── Phase 2: Market Data (Pyth on-chain prices) ──
  const prices = await getMarketPrices(suiClient);
  const pairs = getDerivedPairs(prices);

  // ── Phase 2: DEX Diversification ──
  const dexCounts: Record<string, number> = {};
  for (const pos of state.activePositions) {
    dexCounts[pos.dex] = (dexCounts[pos.dex] ?? 0) + 1;
  }

  // ── Phase 3: On-Chain Activity (whales + ecosystem) ──
  const onChain = await getOnChainContext(6);

  // ── Phase 1: Pool History ──
  const topPools = state.screenedPools.slice(0, 5);
  const historySummaries: string[] = [];
  for (const pool of topPools) {
    const perf = await getPoolPerformance(
      (await import("../integrations/supabase.js")).createSupabaseClient(),
      pool.poolId
    );
    historySummaries.push(
      `${pool.dex} ${pool.tokenPair}: ${perf.wins}W/${perf.losses}L avgPnL=${perf.avgPnl.toFixed(2)}`
    );
  }

  const model = new ChatOpenAI({
    modelName: process.env.DEEPSEEK_MODEL ?? "deepseek/deepseek-chat",
    temperature: 0.3,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1",
    },
  });

  const prompt = `You are ZKurrent, an autonomous LP agent on Sui.

Make ONE decision: OPEN a new position, CLOSE an existing one, REBALANCE, or HOLD.

## Market (Sui Pyth Oracle)
SUI/USD: $${pairs["SUI/USD"].toFixed(2)} (confidence: ±${pairs.confidence.SUI.toFixed(3)})
ETH/USD: $${pairs["ETH/USD"].toFixed(0)} (confidence: ±${pairs.confidence.ETH.toFixed(1)})
ETH/SUI: ${pairs["ETH/SUI"].toFixed(4)}

## Pools (top ${topPools.length}, scored on Sui)
${topPools.map((p, i) => `${i + 1}. ${p.dex} ${p.tokenPair}: score=${p.score} APY=${p.apy.toFixed(1)}% TVL=$${(p.tvl / 1_000_000).toFixed(1)}M vol24h=$${(p.volume24h / 1000).toFixed(0)}K`).join("\n")}

## Positions (${state.activePositions.length} open)
${state.activePositions.length > 0
    ? state.activePositions.map((p) => `- ${p.dex} ${p.tokenPair}: range=[${p.rangeLow},${p.rangeHigh}] fees=+$${p.feesEarned.toFixed(2)} IL=-$${Math.abs(p.impermanentLoss).toFixed(2)} net=${p.netPnl >= 0 ? "+" : "-"}$${Math.abs(p.netPnl).toFixed(2)}`)
    : "(none)"}
DEX breakdown: ${Object.entries(dexCounts).map(([d, c]) => `${d}=${c}`).join(" | ") ?? "none"}

## On-Chain Activity (last 6h on Sui)
${onChain.whales.length > 0
    ? onChain.whales.map((w) => `WHALE: ${w.amount.toLocaleString()} SUI → ${w.dex} ${w.poolId} (${w.type})`).join("\n")
    : "(no whale activity)"}
${onChain.events.filter((e) => e.type === "new_pool").length > 0
    ? onChain.events.filter((e) => e.type === "new_pool").map((e) => `NEW POOL: ${e.dex} ${e.detail}`).join("\n")
    : ""}

## History (pool performance)
${historySummaries.join("\n")}

## Config
Target APY: ${((state.config?.targetApyBps ?? 1500) / 100).toFixed(1)}%
Max IL: ${((state.config?.maxIlThresholdBps ?? 500) / 100).toFixed(1)}%
Risk tolerance: ${state.config?.riskTolerance ?? 50}/100

## Rules
1. CLOSE immediately if any position's IL > ${((state.config?.maxIlThresholdBps ?? 500) / 100).toFixed(1)}%
2. If 0 open positions: OPEN on the best-scored pool
3. Diversify across DEXes — no more than 3 positions per DEX
4. Prefer pools with positive historical avg PnL
5. If whale inflow detected: DEFER opening on that pool this cycle
6. If new high-TVL pool detected: consider for next cycle, not this one

Respond with a single action word and optional detail:
  OPEN pool=<idx> dex=<dex>
  CLOSE pool=<idx>
  REBALANCE from=<idx> to=<idx>
  HOLD

Action:`;

  const response = await model.invoke(prompt);
  const raw = (response.content as string).toLowerCase().trim();
  const actionText = raw.split("\n")[0]?.split(" ")[0] ?? "hold";
  const actionMap: Record<string, AgentAction> = {
    open: "open", close: "close", rebalance: "rebalance", hold: "hold", skip: "skip",
  };

  // Extract pool info if provided
  const poolMatch = raw.match(/pool=(\d+)/);
  const dexMatch = raw.match(/dex=(\w+)/);
  const selectedPoolIdx = poolMatch ? parseInt(poolMatch[1]) - 1 : 0;
  const selectedDex = dexMatch?.[1] ?? topPools[0]?.dex;

  // Find the pool matching both idx and dex if specified
  let selectedPool = topPools[selectedPoolIdx] ?? null;
  if (selectedDex && selectedPool?.dex !== selectedDex) {
    selectedPool = topPools.find((p) => p.dex === selectedDex) ?? selectedPool;
  }

  return {
    cycleStatus: "executing",
    selectedAction: actionMap[actionText] ?? "hold",
    selectedPool: selectedPool ?? state.screenedPools[0] ?? null,
    lastError: null,
  };
}
