import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import type { PoolScore, PositionRecord, AgentConfig } from "../types.js";

const PACKAGE_ID = process.env.ZKURRENT_PACKAGE_ID!;
const AGENT_CONFIG_ID = process.env.ZKURRENT_AGENT_CONFIG_ID!;
const POSITION_TRACKER_ID = process.env.ZKURRENT_POSITION_TRACKER_ID!;

export function createSuiClient(): {
  client: SuiClient;
  keypair: Ed25519Keypair;
} {
  const client = new SuiClient({
    url: process.env.SUI_RPC_URL ?? getFullnodeUrl("testnet"),
  });

  const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(process.env.SUI_PRIVATE_KEY!, "base64").slice(1)
  );

  return { client, keypair };
}

// ── Read Agent Config ──

export async function loadAgentConfig(
  client: SuiClient
): Promise<AgentConfig | null> {
  try {
    const obj = await client.getObject({
      id: AGENT_CONFIG_ID,
      options: { showContent: true },
    });

    if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
      return null;
    }

    const fields = obj.data.content.fields as Record<string, unknown>;
    return {
      owner: fields.owner as string,
      riskTolerance: Number(fields.risk_tolerance),
      targetApyBps: Number(fields.target_apy),
      maxIlThresholdBps: Number(fields.max_il_threshold),
      poolAllowlist: (fields.pool_allowlist as string[]) ?? [],
      poolBlocklist: (fields.pool_blocklist as string[]) ?? [],
      rebalanceIntervalMs: Number(fields.rebalance_interval) * 1000,
      isActive: fields.is_active as boolean,
      updatedAt: new Date(Number(fields.updated_at) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

// ── Read Active Positions ──

export async function loadPositionsFromChain(
  client: SuiClient
): Promise<PositionRecord[]> {
  try {
    const obj = await client.getObject({
      id: POSITION_TRACKER_ID,
      options: { showContent: true },
    });

    if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
      return [];
    }

    const fields = obj.data.content.fields as Record<string, unknown>;
    const positions = (fields.positions as Array<Record<string, unknown>>) ?? [];

    return positions.map((p: Record<string, unknown>) => ({
      positionId: String(p.position_id ?? ""),
      poolId: String(p.pool_id ?? ""),
      dex: mapDexCode(Number(p.dex ?? 0)),
      tokenPair: String(p.token_pair ?? ""),
      amountIn: Number(p.amount_in ?? 0),
      amountInUsd: 0,
      entryPrice: Number(p.entry_price ?? 0),
      currentPrice: undefined,
      exitPrice: p.exit_price ? Number(p.exit_price) : undefined,
      rangeLow: Number(p.range_low ?? 0),
      rangeHigh: Number(p.range_high ?? 0),
      feesEarned: Number(p.fees_earned ?? 0),
      impermanentLoss: Number(p.impermanent_loss ?? 0),
      netPnl: Number(p.net_pnl ?? 0),
      status: mapStatusCode(Number(p.status ?? 0)),
      openedAt: new Date(Number(p.opened_at ?? 0) * 1000).toISOString(),
      closedAt: p.closed_at ? new Date(Number(p.closed_at) * 1000).toISOString() : undefined,
      txDigest: undefined,
    }));
  } catch {
    return [];
  }
}

// ── Execute: Open LP Position ──

export async function openLPPosition(
  client: SuiClient,
  keypair: Ed25519Keypair,
  pool: PoolScore,
  config: AgentConfig
): Promise<{ txDigest: string; positionId: string }> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::position_tracker::open_position`,
    arguments: [
      tx.object(POSITION_TRACKER_ID),
      tx.pure.string(pool.poolId),
      tx.pure.u8(mapDexToCode(pool.dex)),
      tx.pure.string(pool.tokenPair),
      tx.pure.u64(1_000_000_000), // 1 SUI default
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });

  return {
    txDigest: result.digest,
    positionId: `${pool.poolId}-${Date.now()}`,
  };
}

// ── Execute: Close LP Position ──

export async function closeLPPosition(
  client: SuiClient,
  keypair: Ed25519Keypair,
  position: PositionRecord
): Promise<{ txDigest: string }> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::position_tracker::close_position`,
    arguments: [
      tx.object(POSITION_TRACKER_ID),
      tx.pure.u64(Number(position.positionId)),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });

  return { txDigest: result.digest };
}

// ── Execute: Update Agent Config ──

export async function updateAgentConfig(
  client: SuiClient,
  keypair: Ed25519Keypair,
  config: Partial<AgentConfig>
): Promise<{ txDigest: string }> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::agent_config::update`,
    arguments: [
      tx.object(AGENT_CONFIG_ID),
      tx.pure.u8(config.riskTolerance ?? 0),
      tx.pure.u64(config.targetApyBps ?? 0),
      tx.pure.u64(config.maxIlThresholdBps ?? 0),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });

  return { txDigest: result.digest };
}

// ── Helpers ──

function mapDexCode(code: number): PositionRecord["dex"] {
  switch (code) {
    case 0: return "deepbook";
    case 1: return "turbos";
    case 2: return "cetus";
    default: return "deepbook";
  }
}

function mapDexToCode(dex: PositionRecord["dex"]): number {
  switch (dex) {
    case "deepbook": return 0;
    case "turbos": return 1;
    case "cetus": return 2;
  }
}

function mapStatusCode(code: number): PositionRecord["status"] {
  switch (code) {
    case 0: return "open";
    case 1: return "closed";
    case 2: return "rebalanced";
    default: return "open";
  }
}
