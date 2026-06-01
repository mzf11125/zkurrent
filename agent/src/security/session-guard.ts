/**
 * Session Guard — Cycle Limits & Circuit Breaker
 *
 * Prevents runaway agent execution by enforcing per-cycle
 * operation limits and a circuit breaker pattern.
 */

let cycleCount = 0;
let lastCycleTime = Date.now();
const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000; // 60 seconds
let circuitOpen = false;
let circuitOpenedAt = 0;

interface SessionLimits {
  maxIterationsPerCycle: number;
  cycleCooldownMs: number;
  maxConsecutiveFails: number;
}

const DEFAULT_LIMITS: SessionLimits = {
  maxIterationsPerCycle: 1,
  cycleCooldownMs: 30_000,
  maxConsecutiveFails: 3,
};

// ── Cycle Counter ──

export function advanceCycle(): { cycleId: number; exceeded: boolean } {
  const now = Date.now();
  const timeSinceLast = now - lastCycleTime;

  cycleCount++;
  lastCycleTime = now;

  return {
    cycleId: cycleCount,
    exceeded: timeSinceLast < DEFAULT_LIMITS.cycleCooldownMs && cycleCount > 1,
  };
}

export function getCycleCount(): number {
  return cycleCount;
}

export function resetCycles(): void {
  cycleCount = 0;
  lastCycleTime = Date.now();
}

// ── Circuit Breaker ──

export function tripCircuit(): void {
  circuitOpen = true;
  circuitOpenedAt = Date.now();
}

export function resetCircuit(): void {
  circuitOpen = false;
  circuitOpenedAt = 0;
}

export function isCircuitOpen(): boolean {
  if (!circuitOpen) return false;

  const elapsed = Date.now() - circuitOpenedAt;
  if (elapsed >= CIRCUIT_BREAKER_COOLDOWN_MS) {
    resetCircuit(); // Auto-reset after cooldown
    return false;
  }

  return true;
}

export function getCircuitStatus(): string {
  if (!circuitOpen) return "closed";
  const remaining = Math.ceil((CIRCUIT_BREAKER_COOLDOWN_MS - (Date.now() - circuitOpenedAt)) / 1000);
  return `open — ${remaining}s remaining`;
}

// ── Guard Check ──

export function checkSessionGuard(params: {
  lastActionFailed: boolean;
  consecutiveFails: number;
}): { allowed: boolean; reason?: string } {
  // Circuit breaker check
  if (isCircuitOpen()) {
    return { allowed: false, reason: `Circuit breaker open: ${getCircuitStatus()}` };
  }

  // Trip on consecutive failures
  if (params.consecutiveFails >= DEFAULT_LIMITS.maxConsecutiveFails) {
    tripCircuit();
    return {
      allowed: false,
      reason: `Circuit breaker tripped after ${params.consecutiveFails} consecutive failures`,
    };
  }

  // Hard cooldown after each cycle
  const timeSinceLast = Date.now() - lastCycleTime;
  if (timeSinceLast < DEFAULT_LIMITS.cycleCooldownMs && cycleCount > 0) {
    return {
      allowed: false,
      reason: `Cycle cooldown: ${Math.ceil((DEFAULT_LIMITS.cycleCooldownMs - timeSinceLast) / 1000)}s remaining`,
    };
  }

  return { allowed: true };
}
