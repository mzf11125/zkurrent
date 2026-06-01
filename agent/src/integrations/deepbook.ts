import type { PoolScore } from "../types.js";

const INDEXER_URL = process.env.SUI_RPC_URL ?? "https://fullnode.testnet.sui.io:443";

// ── DeepBook V3 Pool Screener ──

export async function screenDeepBookPools(): Promise<PoolScore[]> {
  // Phase 1: Query Sui indexer for DeepBook pool data
  // Production: Use @deepbook/sdk for precise orderbook data
  // For hackathon: GraphQL query to Sui indexer for pool TVL/volume

  const query = `
    query DeepBookPools {
      pools: deepbook_pools(limit: 20, order_by: { tvl: desc }) {
        pool_id
        base_asset
        quote_asset
        tvl
        volume_24h
        fees_24h
      }
    }
  `;

  try {
    const response = await fetch(INDEXER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    const pools = result.data?.pools ?? [];

    return pools.map((p: Record<string, unknown>, i: number) => ({
      poolId: `deepbook-${p.pool_id as string}`,
      dex: "deepbook" as const,
      tokenPair: `${p.base_asset as string}/${p.quote_asset as string}`,
      tvl: Number(p.tvl ?? 0),
      volume24h: Number(p.volume_24h ?? 0),
      apy: computeAPY(Number(p.fees_24h ?? 0), Number(p.tvl ?? 1)),
      fees24h: Number(p.fees_24h ?? 0),
      score: 0,
      rank: i + 1,
      scannedAt: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

// ── Turbos CLMM Pool Screener ──

export async function screenTurbosPools(): Promise<PoolScore[]> {
  // Turbos CLMM SDK — query concentrated liquidity pools
  // For hackathon: fallback to mock data structure

  return [
    {
      poolId: "turbos-sui-usdc",
      dex: "turbos" as const,
      tokenPair: "SUI/USDC",
      tvl: 5_100_000,
      volume24h: 310_000,
      apy: 18.5,
      fees24h: 1_550,
      score: 0,
      rank: 1,
      scannedAt: new Date().toISOString(),
    },
  ];
}

// ── Cetus CLMM Pool Screener ──

export async function screenCetusPools(): Promise<PoolScore[]> {
  // Cetus CLMM SDK — query concentrated liquidity pools
  // For hackathon: fallback to mock data structure

  return [
    {
      poolId: "cetus-sui-usdc",
      dex: "cetus" as const,
      tokenPair: "SUI/USDC",
      tvl: 3_200_000,
      volume24h: 195_000,
      apy: 12.3,
      fees24h: 980,
      score: 0,
      rank: 1,
      scannedAt: new Date().toISOString(),
    },
  ];
}

// ── Helpers ──

function computeAPY(fees24h: number, tvl: number): number {
  if (tvl <= 0) return 0;
  return (fees24h / tvl) * 365 * 100;
}
