import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentState, CycleOutcome } from "../types.js";
import { recordCycleOutcome } from "../integrations/supabase.js";

export async function learnNode(
  state: typeof AgentState.State,
  config?: { configurable?: { supabase?: SupabaseClient } }
): Promise<Partial<typeof AgentState.State>> {
  const supabase = config?.configurable?.supabase;
  if (!supabase) return { lastError: null };

  try {
    const outcome: CycleOutcome = {
      cycleId: `cycle-${Date.now()}`,
      action: state.selectedAction ?? "skip",
      poolId: state.selectedPool?.poolId,
      dex: state.selectedPool?.dex,
      feesEarned: state.targetPosition?.feesEarned ?? 0,
      impermanentLoss: state.targetPosition?.impermanentLoss ?? 0,
      netPnl: state.targetPosition?.netPnl ?? 0,
      startedAt: new Date(
        Date.now() - (state.config?.rebalanceIntervalMs ?? 300_000)
      ).toISOString(),
      completedAt: new Date().toISOString(),
    };

    await recordCycleOutcome(supabase, outcome);

    return {
      cycleHistory: [...state.cycleHistory, outcome],
      lastError: null,
    };
  } catch (err) {
    return {
      lastError: err instanceof Error ? err.message : "Learning failed",
    };
  }
}
