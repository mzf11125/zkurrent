/**
 * ZKurrent Guard — Policy Engine (Fast-Path Pre-Filter)
 *
 * Validates LLM output BEFORE any on-chain execution.
 * Hardware constraints that the LLM cannot bypass.
 *
 * ⚠️ This is a fast-path pre-filter. Authoritative cryptographic
 * enforcement lives in the Midnight Compact circuit (strategy_attest.compact).
 * The ZK circuit enforces the same constraints but with cryptographic proofs
 * that cannot be bypassed — a failed constraint means no proof can be generated.
 *
 * Inspired by Bastion's ERC-7579 validator module pattern:
 * a per-agent policy engine that sits between the AI and execution.
 */

import type { AgentAction, AgentConfig, PoolScore, PositionRecord } from "../types.js";

// ── Guard Policy ──

interface GuardPolicy {
  allowedActions: AgentAction[];
  maxPositionsPerDex: number;
  maxPositionsTotal: number;
  maxIlThresholdBps: number;
  poolAllowlist: string[];
  poolBlocklist: string[];
  maxCycleActions: number;
  maxConsecutiveOpens: number;
  maxFailsBeforeCooldown: number;
}

export interface GuardResult {
  passed: boolean;
  violation?: string;
  action?: AgentAction;
  pool?: PoolScore;
}

// ── Policy Builder ──

function buildPolicy(config: AgentConfig): GuardPolicy {
  return {
    allowedActions: ["open", "close", "rebalance", "hold", "skip"],
    maxPositionsPerDex: 3,
    maxPositionsTotal: 20,
    maxIlThresholdBps: config.maxIlThresholdBps,
    poolAllowlist: config.poolAllowlist ?? [],
    poolBlocklist: config.poolBlocklist ?? [],
    maxCycleActions: 1,
    maxConsecutiveOpens: 5,
    maxFailsBeforeCooldown: 3,
  };
}

// ── Validators ──

function validateAction(action: string, policy: GuardPolicy): string | null {
  if (!policy.allowedActions.includes(action as AgentAction)) {
    return `Action "${action}" is not allowed. Allowed: ${policy.allowedActions.join(", ")}`;
  }
  return null;
}

function validatePool(
  pool: PoolScore | null | undefined,
  action: AgentAction,
  policy: GuardPolicy
): string | null {
  if (action === "hold" || action === "skip" || action === "close") {
    return null; // No pool validation needed
  }

  if (!pool) {
    return "No pool selected for OPEN/REBALANCE action";
  }

  if (policy.poolBlocklist.length > 0 && policy.poolBlocklist.includes(pool.poolId)) {
    return `Pool ${pool.poolId} is blocked`;
  }

  if (
    policy.poolAllowlist.length > 0 &&
    !policy.poolAllowlist.includes(pool.poolId)
  ) {
    return `Pool ${pool.poolId} is not in the allowlist`;
  }

  return null;
}

function validateILThreshold(
  targetPosition: PositionRecord | null | undefined,
  action: AgentAction,
  policy: GuardPolicy
): string | null {
  if (action !== "close" || !targetPosition) return null;

  const ilPercent = Math.abs(targetPosition.impermanentLoss);
  if (ilPercent > policy.maxIlThresholdBps) {
    return null; // Closing above threshold is correct
  }

  return `Cannot close position: IL (${ilPercent.toFixed(1)}%) is below threshold (${(policy.maxIlThresholdBps / 100).toFixed(1)}%)`;
}

function validateDexDiversification(
  activePositions: PositionRecord[],
  selectedPool: PoolScore | null,
  action: AgentAction,
  policy: GuardPolicy
): string | null {
  if (action !== "open" || !selectedPool) return null;

  const countPerDex: Record<string, number> = {};
  for (const pos of activePositions) {
    countPerDex[pos.dex] = (countPerDex[pos.dex] ?? 0) + 1;
  }

  const currentCount = countPerDex[selectedPool.dex] ?? 0;
  if (currentCount >= policy.maxPositionsPerDex) {
    return `DEX ${selectedPool.dex} has ${currentCount} positions (max: ${policy.maxPositionsPerDex})`;
  }

  return null;
}

function validatePositionLimit(
  activePositions: PositionRecord[],
  action: AgentAction,
  policy: GuardPolicy
): string | null {
  if (action !== "open") return null;

  if (activePositions.length >= policy.maxPositionsTotal) {
    return `Position limit reached (${activePositions.length}/${policy.maxPositionsTotal})`;
  }

  return null;
}

// ── Consecutive Opens Check ──

let consecutiveOpens = 0;
let consecutiveFails = 0;

function validateConsecutiveOpens(
  action: AgentAction,
  policy: GuardPolicy
): string | null {
  if (action === "open") {
    if (consecutiveOpens >= policy.maxConsecutiveOpens) {
      return `Too many consecutive opens (${consecutiveOpens}). Cooling down.`;
    }
    consecutiveOpens++;
  } else {
    consecutiveOpens = 0;
  }
  return null;
}

// ── Circuit Breaker ──

export function recordGuardFailure(): void {
  consecutiveFails++;
}

export function recordGuardPass(): void {
  consecutiveFails = 0;
}

function validateCircuitBreaker(policy: GuardPolicy): string | null {
  if (consecutiveFails >= policy.maxFailsBeforeCooldown) {
    return `Circuit breaker open: ${consecutiveFails} consecutive failures. Cooldown active.`;
  }
  return null;
}

// ── Main Guard ──

export function guard(params: {
  action: AgentAction;
  pool?: PoolScore | null;
  targetPosition?: PositionRecord | null;
  activePositions: PositionRecord[];
  config: AgentConfig;
}): GuardResult {
  const policy = buildPolicy(params.config);

  const checks: Array<[string, () => string | null]> = [
    ["action_valid", () => validateAction(params.action, policy)],
    ["pool_allowed", () => validatePool(params.pool, params.action, policy)],
    [
      "il_threshold",
      () => validateILThreshold(params.targetPosition, params.action, policy),
    ],
    [
      "dex_diversification",
      () =>
        validateDexDiversification(
          params.activePositions,
          params.pool ?? null,
          params.action,
          policy
        ),
    ],
    [
      "position_limit",
      () => validatePositionLimit(params.activePositions, params.action, policy),
    ],
    [
      "consecutive_opens",
      () => validateConsecutiveOpens(params.action, policy),
    ],
    [
      "circuit_breaker",
      () => validateCircuitBreaker(policy),
    ],
  ];

  for (const [_, check] of checks) {
    const violation = check();
    if (violation) {
      return {
        passed: false,
        violation,
        action: params.action,
        pool: params.pool ?? undefined,
      };
    }
  }

  recordGuardPass();
  return { passed: true, action: params.action };
}

// ── Pre-execution Guard (re-check before on-chain tx) ──

export function preExecutionGuard(params: {
  action: AgentAction;
  poolId?: string;
  config: AgentConfig;
}): GuardResult {
  const policy = buildPolicy(params.config);

  if (!params.poolId) {
    return { passed: true, action: params.action };
  }

  // Final blocklist check before signing the transaction
  if (policy.poolBlocklist.includes(params.poolId)) {
    return {
      passed: false,
      violation: `Pre-execution block: pool ${params.poolId} is blocked`,
      action: params.action,
    };
  }

  return { passed: true, action: params.action };
}
