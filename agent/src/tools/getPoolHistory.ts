import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getPoolPerformance } from "../integrations/supabase.js";

export const getPoolHistoryTool = tool(
  async (input, config) => {
    // config contains Supabase client via configurable
    try {
      const perf = await getPoolPerformance(
        config.configurable?.supabase,
        input.poolId
      );

      return JSON.stringify({
        poolId: input.poolId,
        wins: perf.wins,
        losses: perf.losses,
        winRate: perf.wins + perf.losses > 0
          ? Math.round((perf.wins / (perf.wins + perf.losses)) * 100)
          : 0,
        avgPnl: perf.avgPnl,
        message:
          perf.wins + perf.losses > 0
            ? `Pool ${input.poolId}: ${perf.wins}W/${perf.losses}L, avg PnL ${perf.avgPnl.toFixed(2)}`
            : "No history for this pool yet.",
      });
    } catch {
      return JSON.stringify({
        poolId: input.poolId,
        wins: 0,
        losses: 0,
        message: "No history available.",
      });
    }
  },
  {
    name: "get_pool_history",
    description:
      "Get historical win/loss and average PnL for a specific pool. Helps the agent learn which pools perform best.",
    schema: z.object({
      poolId: z.string().describe("Pool ID to query history for"),
    }),
  }
);
