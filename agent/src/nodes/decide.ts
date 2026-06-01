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

// ── LLM-Enhanced Decision (optional) ──

export async function decideNodeWithLLM(
  state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State>> {
  const model = new ChatOpenAI({
    modelName: process.env.DEEPSEEK_MODEL ?? "deepseek/deepseek-chat",
    temperature: 0.3,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1",
    },
  });

  const prompt = `You are ZKurrent, an autonomous LP agent on Sui.

Current state:
- ${state.activePositions.length} active positions
- ${state.screenedPools.length} pools screened
- Top pool: ${state.screenedPools[0]?.tokenPair ?? "none"} (score: ${state.screenedPools[0]?.score ?? 0}, APY: ${state.screenedPools[0]?.apy ?? 0}%)
- Target APY: ${((state.config?.targetApyBps ?? 1500) / 100).toFixed(1)}%
- Max IL: ${((state.config?.maxIlThresholdBps ?? 500) / 100).toFixed(1)}%

Should the agent: open a new position, close an existing one, rebalance, or hold?
Respond with a single action word.`;

  const response = await model.invoke(prompt);
  const action = (response.content as string).toLowerCase().trim();

  const actionMap: Record<string, AgentAction> = {
    open: "open", close: "close", rebalance: "rebalance", hold: "hold", skip: "skip",
  };

  return {
    cycleStatus: "executing",
    selectedAction: actionMap[action] ?? "hold",
    selectedPool: state.screenedPools[0] ?? null,
    lastError: null,
  };
}
