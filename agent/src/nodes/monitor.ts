import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentState } from "../types.js";
import { getActivePositions, publishEvent } from "../integrations/supabase.js";

export async function monitorNode(
  state: typeof AgentState.State,
  config?: { configurable?: { supabase?: SupabaseClient } }
): Promise<Partial<typeof AgentState.State>> {
  const supabase = config?.configurable?.supabase;
  if (!supabase) {
    return { cycleStatus: "idle", lastError: "Supabase client not configured" };
  }

  try {
    const activePositions = await getActivePositions(supabase, "agent");

    const tvl = activePositions.reduce((sum, p) => sum + p.amountInUsd, 0);
    const cumulativePnl = activePositions.reduce((sum, p) => sum + p.netPnl, 0);

    await publishEvent(supabase, {
      type: "agent:heartbeat",
      status: "healthy",
      activePositions: activePositions.length,
      tvl,
      cumulativePnl,
      timestamp: new Date().toISOString(),
    });

    return {
      cycleStatus: "idle",
      activePositions,
      lastError: null,
    };
  } catch (err) {
    return {
      cycleStatus: "idle",
      lastError: err instanceof Error ? err.message : "Monitor failed",
    };
  }
}

export function routeAfterMonitor(
  state: typeof AgentState.State
): "learn" | "screen" | "__end__" {
  if (state.lastError) return "__end__";
  if (state.selectedAction === "close" || state.selectedAction === "open") {
    return "learn";
  }
  return "screen";
}
