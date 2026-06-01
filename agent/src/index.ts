import "dotenv/config";
import { createSupabaseClient, getStrategyConfig } from "./integrations/supabase.js";
import { loadAgentConfig, createSuiClient } from "./integrations/sui.js";
import { setSenderAddress } from "./integrations/cetus.js";
import { buildZKurrentGraph } from "./graph.js";
import type { PoolScore } from "./types.js";

const INTERVAL_MS = Number(process.env.AGENT_INTERVAL_MS ?? 300_000);
const supabase = createSupabaseClient();
const { client: suiClient, keypair } = createSuiClient();

// Set Cetus SDK sender from Sui keypair
setSenderAddress(keypair.toSuiAddress());

async function runAgentCycle() {
  const graph = buildZKurrentGraph();

  // Load config from on-chain (primary) or Supabase (fallback)
  const config = (await loadAgentConfig(suiClient)) ?? null;
  if (!config) {
    const dbConfig = await getStrategyConfig(supabase, keypair.toSuiAddress());
    console.warn("On-chain config not found. Using DB fallback.");
  }

  if (config && !config.isActive) {
    console.log("Agent is paused. Skipping cycle.");
    return;
  }

  console.log(`[${new Date().toISOString()}] Starting agent cycle...`);

  const result = await graph.invoke(
    {
      cycleStatus: "idle",
      screenedPools: [] as PoolScore[],
      activePositions: [],
      config,
      selectedAction: null,
      selectedPool: null,
      targetPosition: null,
      currentCycle: 0,
      cycleHistory: [],
      lastError: null,
    },
    {
      configurable: {
        supabase,
        suiClient,
        keypair,
      },
    }
  );

  if (result.lastError) {
    console.error(`Cycle error: ${result.lastError}`);
  } else {
    console.log(
      `Cycle complete. Action: ${result.selectedAction}, Pool: ${result.selectedPool?.tokenPair ?? "none"}`
    );
  }
}

// ── Start Agent ──

console.log("╔══════════════════════════════════════════╗");
console.log("║         ZKurrent Agent v0.1.0            ║");
console.log("║  Sui LP Execution + Midnight ZK Proofs    ║");
console.log("╚══════════════════════════════════════════╝");
console.log(`   Sender: ${keypair.toSuiAddress()}`);
console.log(`   RPC:    ${process.env.SUI_RPC_URL ?? "testnet"}`);
console.log(`   Cycle:  every ${INTERVAL_MS / 1000}s`);
console.log(`   ZK:     Midnight ${process.env.MIDNIGHT_NETWORK ?? "preprod"}`);
console.log("");

// Run immediately, then on interval
runAgentCycle().catch(console.error);
setInterval(runAgentCycle, INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nAgent shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nAgent shutting down...");
  process.exit(0);
});
