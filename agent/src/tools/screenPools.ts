import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { screenDeepBookPools } from "../integrations/deepbook.js";
import { screenCetusPools } from "../integrations/cetus.js";
import { screenCetusDlmmPools } from "../integrations/cetus-dlmm.js";

export async function screenPools(): Promise<PoolScore[]> {
  const [deepbook, cetus, cetusDlmm] = await Promise.all([
    screenDeepBookPools().catch(() => [] as PoolScore[]),
    screenCetusPools().catch(() => [] as PoolScore[]),
    screenCetusDlmmPools().catch(() => [] as PoolScore[]),
  ]);

  const all = [...deepbook, ...cetus, ...cetusDlmm];

  const scored = all.map((pool) => {
    const volumeScore = clamp(pool.volume24h / 1_000_000, 0, 40);
    const apyScore = clamp(pool.apy / 2, 0, 40);
    const tvlScore = clamp(pool.tvl / 10_000_000, 0, 20);
    const score = Math.round(volumeScore + apyScore + tvlScore);

    return { ...pool, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const screenPoolsTool = tool(
  async () => {
    const pools = await screenPools();
    return JSON.stringify(pools.slice(0, 10));
  },
  {
    name: "screen_pools",
    description:
      "Screen all liquidity pools across DeepBook and Cetus. Returns top 10 pools ranked by composite score (TVL + volume + APY).",
    schema: z.object({}),
  }
);
