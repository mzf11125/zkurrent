/**
 * Midnight Network Integration — ZK Attestation Layer
 *
 * Follows Midnight Skills patterns:
 *   - 1AM Wallet: window.midnight['1am'] for dust-free proving
 *   - Compact: circuit/witness/constraint for ZK contracts
 *   - ProofStation: HTTP POST /prove for off-chain proof generation
 *   - Indexer: GraphQL for proof verification on-ledger
 */

import type { ZKProofRecord } from "../types.js";

const INDEXER_URL =
  process.env.MIDNIGHT_INDEXER_URL ??
  "https://indexer.preprod.midnight.network/api/v4/graphql";
const PROOF_SERVER_URL =
  process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://localhost:6300";
const MIDNIGHT_RPC =
  process.env.MIDNIGHT_RPC_URL ?? "https://rpc.preprod.midnight.network";

// ── Compact Contract: strategy_attest ──
//
// Verifies that LP operations comply with user-configured AgentConfig.
// Public inputs: config_hash + position_count
// Private witnesses: actual position parameters (never leave the circuit)

const STRATEGY_ATTEST_CIRCUIT = `
circuit StrategyAttestation {
    // ── Public inputs (visible on Midnight ledger) ──
    public config_hash: Hash;
    public position_count: UInt;

    // ── Private witnesses (never touch the chain) ──
    witness position_ranges: Array<(Price, Price)>;
    witness entry_prices: Array<Price>;
    witness amounts: Array<Amount>;
    witness max_il_breached: Array<Bool>;

    // ── Constraint: no position exceeded IL threshold ──
    constraint forall i in 0..position_count:
        max_il_breached[i] == false;
}
`;

// ── Compact Contract: performance_proof ──
//
// Verifiable cumulative PnL attestation.
// Third parties verify: "This agent earned X% APY over Y days"
// without seeing individual trades, pools, or amounts.

const PERFORMANCE_PROOF_CIRCUIT = `
circuit PerformanceProof {
    // ── Public inputs ──
    public cumulative_pnl: Int64;
    public period_start: Timestamp;
    public period_end: Timestamp;

    // ── Private witnesses ──
    witness trade_outcomes: Array<TradeOutcome>;
    witness fee_accrual: Array<Amount>;
    witness il_events: Array<ILRecord>;

    // ── Constraint: cumulative = sum of all trades ──
    constraint cumulative_pnl == sum_trades(trade_outcomes, fee_accrual, il_events);
}
`;

// ── Proof Generation (via ProofStation) ──

export async function generateStrategyProof(params: {
  configHash: string;
  positions: Array<{
    rangeLow: number;
    rangeHigh: number;
    entryPrice: number;
    amount: number;
    il: number;
  }>;
  maxIlThreshold: number;
}): Promise<{ proofHash: string; midnightBlockHash?: string }> {
  const witnesses = params.positions.map((p) => ({
    range_low: p.rangeLow,
    range_high: p.rangeHigh,
    entry_price: p.entryPrice,
    amount: p.amount,
    max_il_breached: p.il > params.maxIlThreshold,
  }));

  const anyBreached = witnesses.some((w) => w.max_il_breached);
  if (anyBreached) {
    throw new Error("Strategy violation: IL threshold exceeded. Proof generation aborted.");
  }

  const response = await fetch(`${PROOF_SERVER_URL}/prove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      circuit: "strategy_attest",
      publicInputs: {
        config_hash: params.configHash,
        position_count: params.positions.length,
      },
      privateWitnesses: { positions: witnesses },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `ProofStation error (${response.status}): ${await response.text()}`
    );
  }

  const result = await response.json();
  return {
    proofHash: result.proof_hash,
    midnightBlockHash: result.block_hash,
  };
}

export async function generatePerformanceProof(params: {
  cumulativePnl: number;
  periodStart: string;
  periodEnd: string;
  trades: Array<{ fees: number; il: number; netPnl: number }>;
}): Promise<{ proofHash: string; midnightBlockHash?: string }> {
  const response = await fetch(`${PROOF_SERVER_URL}/prove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      circuit: "performance_proof",
      publicInputs: {
        cumulative_pnl: params.cumulativePnl,
        period_start: params.periodStart,
        period_end: params.periodEnd,
      },
      privateWitnesses: { trades: params.trades },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Performance proof error (${response.status}): ${await response.text()}`
    );
  }

  const result = await response.json();
  return {
    proofHash: result.proof_hash,
    midnightBlockHash: result.block_hash,
  };
}

// ── Proof Verification (via Indexer GraphQL) ──

export async function verifyProofOnMidnight(proofHash: string): Promise<{
  verified: boolean;
  blockHeight?: number;
  timestamp?: string;
}> {
  const query = `
    query VerifyAttestation($hash: String!) {
      transactions(
        where: { memo: { _eq: $hash } }
        limit: 1
      ) {
        hash
        blockHeight
        timestamp
      }
    }
  `;

  const response = await fetch(INDEXER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { hash: proofHash } }),
  });

  const result = await response.json();
  const txs = result.data?.transactions ?? [];

  return {
    verified: txs.length > 0,
    blockHeight: txs[0]?.blockHeight,
    timestamp: txs[0]?.timestamp,
  };
}

// ── Proof Hash Relay to Sui ──

export function buildZKProofRecord(params: {
  proofHash: string;
  proofType: "strategy_compliance" | "performance";
  midnightBlockHash?: string;
}): ZKProofRecord {
  return {
    proofId: `proof-${Date.now()}-${params.proofHash.slice(0, 8)}`,
    proofType: params.proofType,
    proofHash: params.proofHash,
    midnightBlockHash: params.midnightBlockHash,
    verifiedAt: new Date().toISOString(),
  };
}

// ── 1AM Wallet Provider (browser environment) ──

export async function getMidnightProvider(): Promise<unknown | null> {
  if (typeof window === "undefined") return null;

  const midnight = (window as Record<string, unknown>).midnight as
    | Record<string, unknown>
    | undefined;

  if (!midnight?.["1am"]) {
    console.error("1AM wallet not detected. Install the 1AM browser extension.");
    return null;
  }

  return midnight["1am"];
}

// ── Deploy Compact Contract (CLI helper) ──

export async function deployCompactContract(params: {
  contractPath: string;
  network: "preprod" | "preview" | "mainnet";
}): Promise<{ contractAddress: string }> {
  // Uses Midnight's yarn midnight:deploy workflow
  // Reference: npx skills add Kali-Decoder/midnight-skills → example-counter
  const response = await fetch(`${MIDNIGHT_RPC}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contract: params.contractPath,
      network: params.network,
    }),
  });

  const result = await response.json();
  return { contractAddress: result.address };
}

// ── Export for agent use ──

export const ZKURENT_MIDNIGHT_TOOLS = {
  circuits: {
    strategyAttest: STRATEGY_ATTEST_CIRCUIT,
    performanceProof: PERFORMANCE_PROOF_CIRCUIT,
  },
  generateStrategyProof,
  generatePerformanceProof,
  verifyProofOnMidnight,
  buildZKProofRecord,
  getMidnightProvider,
  deployCompactContract,
} as const;
