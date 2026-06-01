import { createSuiClient } from "../integrations/sui.js";
import { upsertPosition, publishEvent } from "../integrations/supabase.js";
import { preExecutionGuard } from "../security/guard.js";
import { recordDecision } from "../security/audit.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentState, PositionRecord } from "../types.js";

export async function executeNode(
  state: typeof AgentState.State,
  config?: { configurable?: { supabase?: SupabaseClient } }
): Promise<Partial<typeof AgentState.State>> {
  const supabase = config?.configurable?.supabase;
  const { client, keypair } = createSuiClient();

  // ── Pre-execution guard check ──
  if (state.config && state.selectedPool) {
    const preGuard = preExecutionGuard({
      action: state.selectedAction ?? "hold",
      poolId: state.selectedPool.poolId,
      config: state.config,
    });
    if (!preGuard.passed) {
      await recordDecision({
        cycleId: `cycle-${Date.now()}`,
        promptHash: null,
        llmRawOutput: null,
        parsedAction: state.selectedAction ?? "hold",
        guardPassed: false,
        guardViolation: preGuard.violation ?? null,
        executedOnChain: false,
        suiTxDigest: null,
        timestamp: new Date().toISOString(),
      });
      return { cycleStatus: "idle", lastError: `Pre-execution guard: ${preGuard.violation}` };
    }
  }

  try {
    switch (state.selectedAction) {
      case "open": {
        if (!state.selectedPool || !state.config) {
          return { cycleStatus: "idle", lastError: "No pool selected" };
        }

        const result = await openLPPosition(
          client, keypair, state.selectedPool, state.config
        );

        const newPosition: PositionRecord = {
          positionId: result.positionId,
          poolId: state.selectedPool.poolId,
          dex: state.selectedPool.dex,
          tokenPair: state.selectedPool.tokenPair,
          amountIn: 1.0,
          amountInUsd: 0,
          entryPrice: 0,
          rangeLow: 0,
          rangeHigh: 0,
          feesEarned: 0,
          impermanentLoss: 0,
          netPnl: 0,
          status: "open",
          openedAt: new Date().toISOString(),
          txDigest: result.txDigest,
        };

        if (supabase) {
          await upsertPosition(supabase, newPosition);
          await publishEvent(supabase, {
            type: "position:opened",
            poolId: state.selectedPool.poolId,
            dex: state.selectedPool.dex,
            tokenPair: state.selectedPool.tokenPair,
            rangeLow: 0,
            rangeHigh: 0,
            txDigest: result.txDigest,
            timestamp: new Date().toISOString(),
          });
        }

        return {
          cycleStatus: "monitoring",
          activePositions: [...state.activePositions, newPosition],
          lastError: null,
        };
      }

      case "close": {
        if (!state.targetPosition) {
          return { cycleStatus: "idle", lastError: "No position to close" };
        }

        const result = await closeLPPosition(client, keypair, state.targetPosition);

        const closedPosition: PositionRecord = {
          ...state.targetPosition,
          status: "closed",
          closedAt: new Date().toISOString(),
          txDigest: result.txDigest,
        };

        if (supabase) {
          await upsertPosition(supabase, closedPosition);
          await publishEvent(supabase, {
            type: "position:closed",
            positionId: state.targetPosition.positionId,
            fees: state.targetPosition.feesEarned,
            il: state.targetPosition.impermanentLoss,
            netPnl: state.targetPosition.netPnl,
            txDigest: result.txDigest,
            timestamp: new Date().toISOString(),
          });
        }

        return {
          cycleStatus: "monitoring",
          activePositions: state.activePositions.filter(
            (p) => p.positionId !== state.targetPosition?.positionId
          ),
          selectedPool: state.screenedPools[0] ?? null,
          lastError: null,
        };
      }

      case "rebalance":
      case "hold":
      case "skip":
      default:
        return { cycleStatus: "monitoring", lastError: null };
    }
  } catch (err) {
    return {
      cycleStatus: "idle",
      lastError: err instanceof Error ? err.message : "Execution failed",
    };
  }
}
