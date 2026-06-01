/**
 * GET /api/v1/agent/status
 *
 * Returns the current agent heartbeat: status, active positions, TVL, cumulative PnL.
 * Requires x402 payment of 0.005 SUI.
 *
 * GET /api/v1/agent/health — Free health check (no x402)
 */

import { Hono } from "hono";
import { x402 } from "../middleware/x402.js";
import { getActivePositions, getPositionHistory } from "../../integrations/supabase.js";
import { loadAgentConfig } from "../../integrations/sui.js";
import { createSupabaseClient } from "../../integrations/supabase.js";
import { createSuiClient } from "../../integrations/sui.js";

const agentRoutes = new Hono();
const supabase = createSupabaseClient();
const { client: suiClient } = createSuiClient();

agentRoutes.get("/status", x402, async (c) => {
  try {
    const [activePositions, onchainConfig] = await Promise.all([
      getActivePositions(supabase, "agent"),
      loadAgentConfig(suiClient),
    ]);

    const tvl = activePositions.reduce((sum, p) => sum + p.amountInUsd, 0);
    const cumulativePnl = activePositions.reduce((sum, p) => sum + p.netPnl, 0);

    return c.json({
      status: onchainConfig?.isActive ? "active" : "paused",
      activePositions: activePositions.length,
      tvl,
      cumulativePnl,
      targetApy: onchainConfig ? `${((onchainConfig.targetApyBps ?? 1500) / 100).toFixed(1)}%` : null,
      maxIL: onchainConfig ? `${((onchainConfig.maxIlThresholdBps ?? 500) / 100).toFixed(1)}%` : null,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    return c.json(
      { error: "Status check failed", message: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});

// GET /api/v1/agent/position-history — Paid
agentRoutes.get("/position-history", x402, async (c) => {
  const limit = Number(c.req.query("limit") ?? "20");
  const positions = await getPositionHistory(supabase, limit);

  return c.json({
    count: positions.length,
    positions,
  });
});

// GET /api/v1/agent/health — Free, no x402
agentRoutes.get("/health", async (c) => {
  return c.json({
    status: "ok",
    version: "0.1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export { agentRoutes };
