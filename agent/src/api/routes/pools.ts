/**
 * GET /api/v1/pools/latest
 *
 * Returns the latest pool screening results from Supabase cache.
 * Requires x402 payment of 0.005 SUI.
 */

import { Hono } from "hono";
import { x402 } from "../middleware/x402.js";
import { screenPools } from "../../tools/screenPools.js";
import { cachePoolMetrics, getLatestPoolMetrics, publishEvent } from "../../integrations/supabase.js";
import { createSupabaseClient } from "../../integrations/supabase.js";

const poolRoutes = new Hono();
const supabase = createSupabaseClient();

poolRoutes.get("/latest", x402, async (c) => {
  try {
    const dex = c.req.query("dex") ?? "all";
    const limit = Number(c.req.query("limit") ?? "20");

    // Try cache first
    const cached = await getLatestPoolMetrics(supabase, dex === "all" ? undefined : dex);

    if (cached.length > 0) {
      return c.json({
        source: "cache",
        count: Math.min(cached.length, limit),
        pools: cached.slice(0, limit),
        scannedAt: cached[0]?.scannedAt,
      });
    }

    // Fallback: fresh screen
    const fresh = await screenPools();
    await cachePoolMetrics(supabase, fresh);
    await publishEvent(supabase, {
      type: "pool:screened",
      poolCount: fresh.length,
      topPool: fresh[0]?.tokenPair ?? "none",
      timestamp: new Date().toISOString(),
    });

    return c.json({
      source: "fresh",
      count: Math.min(fresh.length, limit),
      pools: fresh.slice(0, limit),
      scannedAt: fresh[0]?.scannedAt,
    });
  } catch (err) {
    return c.json(
      { error: "Pool screening failed", message: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});

// GET /api/v1/pools/:poolId/history — Free endpoint (no x402)
poolRoutes.get("/:poolId/history", async (c) => {
  const poolId = c.req.param("poolId");

  const { default: getPoolPerformance } = await import("../../integrations/supabase.js");
  const perf = await getPoolPerformance(supabase, poolId);

  return c.json({
    poolId,
    wins: perf.wins,
    losses: perf.losses,
    winRate: perf.wins + perf.losses > 0
      ? Math.round((perf.wins / (perf.wins + perf.losses)) * 100)
      : 0,
    avgPnl: perf.avgPnl,
  });
});

export { poolRoutes };
