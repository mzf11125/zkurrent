import { screenPools } from "../tools/screenPools.js";
import { cachePoolMetrics } from "../integrations/supabase.js";
import { publishEvent } from "../integrations/supabase.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentState } from "../types.js";

export async function screenNode(
  state: typeof AgentState.State,
  config?: { configurable?: { supabase?: SupabaseClient } }
): Promise<Partial<typeof AgentState.State>> {
  const supabase = config?.configurable?.supabase;
  if (!supabase) {
    return { cycleStatus: "idle", lastError: "Supabase client not configured" };
  }

  try {
    const pools = await screenPools();
    await cachePoolMetrics(supabase, pools);
    await publishEvent(supabase, {
      type: "pool:screened",
      poolCount: pools.length,
      topPool: pools[0]?.tokenPair ?? "none",
      timestamp: new Date().toISOString(),
    });

    return {
      cycleStatus: "deciding",
      screenedPools: pools,
      lastError: null,
    };
  } catch (err) {
    return {
      cycleStatus: "idle",
      lastError: err instanceof Error ? err.message : "Screen failed",
    };
  }
}

export function routeAfterScreen(state: typeof AgentState.State): "decide" | "__end__" {
  if (state.lastError) return "__end__";
  if (state.screenedPools.length === 0) return "__end__";
  return "decide";
}
