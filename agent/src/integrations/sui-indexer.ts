/**
 * Sui Indexer — On-Chain Activity Detection
 *
 * Queries Sui Indexer GraphQL for:
 *   1. Large transfers ("whale movements") into known DEX pool addresses
 *   2. New pool creation events on integrated DEXes
 *   3. Liquidity migration patterns
 */

const INDEXER_URL = process.env.SUI_INDEXER_URL ?? "https://sui-mainnet.indexer.xyz/graphql";

// Known DEX pool-related package IDs
const DEX_PACKAGES = {
  deepbook: process.env.DEEPBOOK_PACKAGE_ID,
  cetus: process.env.CETUS_PACKAGE_ID,
  cetus_dlmm: process.env.CETUS_DLMM_PACKAGE_ID,
  turbos: process.env.TURBOS_PACKAGE_ID,
};

interface WhaleAlert {
  poolId: string;
  dex: string;
  amount: number;
  txDigest: string;
  timestamp: string;
  type: "inflow" | "outflow";
}

interface EcosystemEvent {
  type: "new_pool" | "migration" | "large_trade";
  dex: string;
  detail: string;
  timestamp: string;
}

// ── Whale Detection ──

export async function detectWhaleMovements(
  hoursBack = 6,
  minAmountSui = 100_000
): Promise<WhaleAlert[]> {
  const since = new Date(Date.now() - hoursBack * 3600_000).toISOString();

  const query = `
    query WhaleMovements($since: timestamptz!, $minAmount: numeric!) {
      transactions: transaction_blocks(
        where: {
          timestamp: { _gte: $since }
          amount: { _gte: $minAmount }
        }
        order_by: { timestamp: desc }
        limit: 20
      ) {
        digest
        timestamp
        effects
      }
    }
  `;

  try {
    const response = await fetch(INDEXER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { since, minAmount: minAmountSui } }),
    });

    const result = await response.json();
    const txs = result.data?.transactions ?? [];

    return txs.map((tx: Record<string, unknown>) => ({
      poolId: extractPoolId(tx),
      dex: classifyDex(tx),
      amount: Number(tx.amount ?? 0),
      txDigest: tx.digest as string,
      timestamp: tx.timestamp as string,
      type: "inflow" as const,
    }));
  } catch {
    return [];
  }
}

// ── Ecosystem Events ──

export async function detectEcosystemEvents(
  hoursBack = 24
): Promise<EcosystemEvent[]> {
  const since = new Date(Date.now() - hoursBack * 3600_000).toISOString();
  const events: EcosystemEvent[] = [];

  try {
    // Query for new pool creation events
    const query = `
      query PoolEvents($since: timestamptz!) {
        events(
          where: {
            timestamp: { _gte: $since }
            event_type: { _in: ["PoolCreated", "LiquidityAdded"] }
          }
          order_by: { timestamp: desc }
          limit: 10
        ) {
          event_type
          package_id
          timestamp
          data
        }
      }
    `;

    const response = await fetch(INDEXER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { since } }),
    });

    const result = await response.json();
    const rawEvents = result.data?.events ?? [];

    for (const e of rawEvents as Array<Record<string, unknown>>) {
      events.push({
        type: e.event_type === "PoolCreated" ? "new_pool" : "large_trade",
        dex: classifyDexByPackage(e.package_id as string),
        detail: JSON.stringify(e.data).slice(0, 100),
        timestamp: e.timestamp as string,
      });
    }

    return events;
  } catch {
    return [];
  }
}

// ── Composite: all on-chain context ──

export async function getOnChainContext(hoursBack = 6) {
  const [whales, events] = await Promise.all([
    detectWhaleMovements(hoursBack),
    detectEcosystemEvents(hoursBack * 4),
  ]);

  return {
    whales,
    events,
    summary: {
      whaleCount: whales.length,
      newPools: events.filter((e) => e.type === "new_pool").length,
      hasRecentActivity: whales.length > 0 || events.length > 0,
    },
  };
}

// ── Helpers ──

function extractPoolId(tx: Record<string, unknown>): string {
  const effects = tx.effects as Record<string, unknown> | undefined;
  const mutated = (effects?.mutated as Array<Record<string, unknown>>) ?? [];
  const poolObj = mutated.find((m) =>
    Object.values(DEX_PACKAGES).some((pkg) =>
      (m.package_id as string)?.includes(pkg ?? "")
    )
  );
  return (poolObj?.object_id as string) ?? "unknown";
}

function classifyDex(tx: Record<string, unknown>): string {
  const effects = tx.effects as Record<string, unknown> | undefined;
  const mutated = (effects?.mutated as Array<Record<string, unknown>>) ?? [];
  const poolObj = mutated.find((m) =>
    Object.values(DEX_PACKAGES).some((pkg) =>
      (m.package_id as string)?.includes(pkg ?? "")
    )
  );

  const pkg = (poolObj?.package_id as string) ?? "";
  if (pkg.includes(DEX_PACKAGES.deepbook ?? "")) return "deepbook";
  if (pkg.includes(DEX_PACKAGES.cetus_dlmm ?? "")) return "cetus_dlmm";
  if (pkg.includes(DEX_PACKAGES.cetus ?? "")) return "cetus";
  if (pkg.includes(DEX_PACKAGES.turbos ?? "")) return "turbos";
  return "unknown";
}

function classifyDexByPackage(pkgId: string): string {
  if (pkgId.includes(DEX_PACKAGES.deepbook ?? "")) return "deepbook";
  if (pkgId.includes(DEX_PACKAGES.cetus_dlmm ?? "")) return "cetus_dlmm";
  if (pkgId.includes(DEX_PACKAGES.cetus ?? "")) return "cetus";
  if (pkgId.includes(DEX_PACKAGES.turbos ?? "")) return "turbos";
  return "unknown";
}
