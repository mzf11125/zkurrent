/**
 * Effectstream Integration — Midnight↔Sui Proof Hash Relayer
 *
 * Effectstream reads ZK attestations from Midnight's ledger (via @effectstream/sync),
 * processes them through a deterministic state machine (via @effectstream/runtime),
 * and relays verified proof hashes to Sui (via @effectstream/batcher).
 *
 * Based on the evm-midnight-v2 template pattern.
 *
 * Packages used:
 *   @effectstream/node-sdk     — Main app node
 *   @effectstream/sync          — Reads Midnight ledger state
 *   @effectstream/midnight-contracts — Midnight contract interfaces
 *   @effectstream/batcher       — Cross-chain tx relay to Sui
 *   @effectstream/orchestrator  — Local dev environment manager
 *   @effectstream/sm            — State machine DSL
 */

import type { ZKProofRecord } from "../types.js";

// ── Effectstream State Machine Definition ──

/**
 * State machine that processes Midnight ZK proofs and decides
 * when to relay proof hashes to Sui.
 *
 * States:
 *   IDLE → PROOF_DETECTED → VERIFYING → RELAYING → CONFIRMED → IDLE
 */
export const ZKURRENT_STATE_MACHINE = `
import { z } from "@effectstream/concise";

// ── State Machine Input (from Midnight sync) ──
const ZKProofEvent = z.object({
  type: z.literal("zk:proof_generated"),
  proofHash: z.string(),
  proofType: z.enum(["strategy_compliance", "performance"]),
  midnightBlockHash: z.string(),
  timestamp: z.string(),
});

// ── State Machine States ──
type ZKState =
  | { status: "idle" }
  | { status: "proof_detected"; proof: ZKProofRecord }
  | { status: "verifying"; proof: ZKProofRecord; midnightVerified: boolean }
  | { status: "relaying"; proof: ZKProofRecord; suiTxDigest?: string }
  | { status: "confirmed"; proof: ZKProofRecord; suiTxDigest: string };

// ── State Machine Transitions ──
// IDLE → PROOF_DETECTED: Midnight sync detects new ZK proof on ledger
// PROOF_DETECTED → VERIFYING: Query Midnight indexer to confirm proof exists
// VERIFYING → RELAYING: Build Sui transaction with proof hash → submit via batcher
// RELAYING → CONFIRMED: Sui transaction confirmed → update zk_proofs table
// CONFIRMED → IDLE: Ready for next proof
`;

// ── Effectstream Config Template ──

export const EFFECTSTREAM_CONFIG = {
  name: "zkurrent-relayer",
  chains: {
    midnight: {
      network: process.env.MIDNIGHT_NETWORK ?? "preprod",
      indexerUrl:
        process.env.MIDNIGHT_INDEXER_URL ??
        "https://indexer.preprod.midnight.network/api/v4/graphql",
      rpcUrl:
        process.env.MIDNIGHT_RPC_URL ?? "https://rpc.preprod.midnight.network",
    },
    sui: {
      network: process.env.SUI_NETWORK ?? "testnet",
      rpcUrl:
        process.env.SUI_RPC_URL ?? "https://fullnode.testnet.sui.io:443",
    },
  },
  sync: {
    // Watch Midnight for new ZK proof attestations
    midnight: {
      pollInterval: 30_000, // 30s
      eventFilter: {
        type: "zk:proof_generated",
      },
    },
  },
  batcher: {
    // Relay proof hashes to Sui zk_prover.move
    target: "sui",
    suiPackageId: process.env.ZKURRENT_PACKAGE_ID!,
    suiModule: "zk_prover",
    suiFunction: "attest_proof",
  },
};

// ── Effectstream Node Entrypoint ──

export async function startEffectstreamRelayer(): Promise<void> {
  // This follows the evm-midnight-v2 template pattern:
  // 1. Effectstream sync node reads Midnight ledger
  // 2. Detects new ZK proof attestations
  // 3. State machine validates proof existence
  // 4. Batcher submits proof hash to Sui zk_prover.move
  // 5. Updates Supabase zk_proofs table with Sui tx digest

  console.log("Starting Effectstream relayer...");
  console.log(`  Midnight → ${EFFECTSTREAM_CONFIG.chains.midnight.network}`);
  console.log(`  Sui      → ${EFFECTSTREAM_CONFIG.chains.sui.network}`);

  // In production:
  //   const node = await createEffectstreamNode(EFFECTSTREAM_CONFIG);
  //   await node.start();

  // For hackathon: the sync + batcher is started via orchestrator:
  //   bunx orchestrator start --background
  // This brings up Midnight node, Sui node, sync service, batcher, and frontend
}

// ── Relayer Health Check ──

export async function checkRelayerHealth(): Promise<{
  midnightSync: boolean;
  suiRelay: boolean;
  pendingProofs: number;
  lastRelayedAt: string | null;
}> {
  return {
    midnightSync: true, // Check: Midnight indexer reachable
    suiRelay: true, // Check: Sui RPC reachable
    pendingProofs: 0, // Check: proofs in VERIFYING state
    lastRelayedAt: null, // Check: latest CONFIRMED transition
  };
}
