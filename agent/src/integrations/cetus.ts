import { CetusClmmSDK, TickMath, BN } from "@cetusprotocol/sui-clmm-sdk";
import type { PoolScore, PositionRecord } from "../types.js";

const CETUS_TESTNET_PACKAGE = "0x5372d555ac734e272659136c2a0cd3227f9b92de67c80dc11250307268af2db8";

let sdk: CetusClmmSDK | null = null;

function getSDK(): CetusClmmSDK {
  if (!sdk) {
    sdk = new CetusClmmSDK({
      network: (process.env.SUI_NETWORK as "mainnet" | "testnet") ?? "testnet",
      fullRpcUrl: process.env.SUI_RPC_URL,
    });
  }
  return sdk;
}

export function setSenderAddress(address: string): void {
  getSDK().setSenderAddress(address);
}

// ── Pool Screening ──

export async function screenCetusPools(): Promise<PoolScore[]> {
  try {
    const sdk = getSDK();
    const pools = await sdk.Pool.getPoolsByProtocol();
    const scored: PoolScore[] = [];

    for (const pool of pools.slice(0, 20)) {
      const metrics = await sdk.Pool.getPoolMetrics(pool.poolAddress);
      const apy = calculateAPY(
        Number(metrics.fee_volume_24h ?? 0),
        Number(metrics.tvl ?? 1)
      );

      scored.push({
        poolId: pool.poolAddress,
        dex: "cetus",
        tokenPair: formatTokenPair(pool.coinTypeA, pool.coinTypeB),
        tvl: Number(metrics.tvl ?? 0),
        volume24h: Number(metrics.volume_24h ?? 0),
        apy,
        fees24h: Number(metrics.fee_volume_24h ?? 0),
        volatility24h: computeVolatility(metrics),
        score: 0,
        rank: 0,
        scannedAt: new Date().toISOString(),
      });
    }

    return scored;
  } catch (err) {
    console.error("Cetus pool screening failed:", err);
    return [];
  }
}

// ── Open LP Position ──

export async function openCetusPosition(params: {
  poolAddress: string;
  coinTypeA: string;
  coinTypeB: string;
  amountA: bigint;
  amountB: bigint;
  slippage: number;
  keypair: Parameters<typeof getSDK>[0];
}): Promise<{ txDigest: string; positionId: string }> {
  const sdk = getSDK();
  const pool = await sdk.Pool.getPool(params.poolAddress);

  const currentTick = new BN(pool.current_tick_index).toNumber();
  const tickSpacing = new BN(pool.tickSpacing).toNumber();

  const lowerTick = TickMath.getPrevInitializableTickIndex(
    currentTick - tickSpacing * 10,
    tickSpacing
  );
  const upperTick = TickMath.getNextInitializableTickIndex(
    currentTick + tickSpacing * 10,
    tickSpacing
  );

  const curSqrtPrice = new BN(pool.current_sqrt_price);

  const payload = await sdk.Position.createAddLiquidityFixTokenPayload(
    {
      coinTypeA: params.coinTypeA,
      coinTypeB: params.coinTypeB,
      pool_id: params.poolAddress,
      tick_lower: lowerTick.toString(),
      tick_upper: upperTick.toString(),
      is_open: true,
      fix_amount_a: true,
      amount_a: params.amountA,
      amount_b: params.amountB,
      slippage: params.slippage,
      collect_fee: false,
      rewarder_coin_types: [],
      pos_id: "",
    },
    { slippage: params.slippage, curSqrtPrice }
  );

  const result = await sdk.fullClient.sendTransaction(
    params.keypair,
    payload
  );

  return {
    txDigest: result.digest,
    positionId: `${params.poolAddress}-${Date.now()}`,
  };
}

// ── Close LP Position ──

export async function closeCetusPosition(params: {
  positionId: string;
  poolAddress: string;
  coinTypeA: string;
  coinTypeB: string;
  lowerTick: string;
  upperTick: string;
  liquidity: bigint;
  slippage: number;
  keypair: unknown;
}): Promise<{ txDigest: string }> {
  const sdk = getSDK();

  const pool = await sdk.Pool.getPool(params.poolAddress);
  const curSqrtPrice = new BN(pool.current_sqrt_price);

  const payload = await sdk.Position.createRemoveLiquidityTransactionPayload({
    coinTypeA: params.coinTypeA,
    coinTypeB: params.coinTypeB,
    pool_id: params.poolAddress,
    tick_lower: params.lowerTick,
    tick_upper: params.upperTick,
    delta_liquidity: params.liquidity.toString(),
    collect_fee: true,
    rewarder_coin_types: [],
    pos_id: params.positionId,
    slippage: params.slippage,
    curSqrtPrice,
  });

  const result = await sdk.fullClient.sendTransaction(
    params.keypair as never,
    payload
  );

  return { txDigest: result.digest };
}

// ── Position Queries ──

export async function getCetusPositions(
  owner: string
): Promise<PositionRecord[]> {
  try {
    const sdk = getSDK();
    const positions = await sdk.Position.getPositionsByOwner(owner);
    const records: PositionRecord[] = [];

    for (const pos of positions) {
      const pool = await sdk.Pool.getPool(pos.pool_id);
      records.push({
        positionId: pos.pos_object_id ?? "",
        poolId: pos.pool_id,
        dex: "cetus",
        tokenPair: formatTokenPair(pos.coin_type_a, pos.coin_type_b),
        amountIn: Number(pos.liquidity ?? 0),
        amountInUsd: 0,
        entryPrice: Number(pos.tick_lower_index ?? 0),
        currentPrice: Number(pool.current_sqrt_price),
        exitPrice: undefined,
        rangeLow: Number(pos.tick_lower_index ?? 0),
        rangeHigh: Number(pos.tick_upper_index ?? 0),
        feesEarned: Number(pos.fee_growth_inside ?? 0),
        impermanentLoss: computeIL(pos, pool),
        netPnl: Number(pos.fee_growth_inside ?? 0) - computeIL(pos, pool),
        status: "open",
        openedAt: new Date(Number(pos.at_create_time ?? 0) * 1000).toISOString(),
      });
    }

    return records;
  } catch {
    return [];
  }
}

// ── Helpers ──

function calculateAPY(fees24h: number, tvl: number): number {
  if (tvl <= 0) return 0;
  return (fees24h / tvl) * 365 * 100;
}

function computeVolatility(metrics: Record<string, unknown>): number {
  return Number(metrics.volatility_24h ?? 0);
}

function computeIL(
  pos: Record<string, unknown>,
  pool: Record<string, unknown>
): number {
  // Simplified IL calculation: compare current tick to position range
  const lowerTick = Number(pos.tick_lower_index ?? 0);
  const upperTick = Number(pos.tick_upper_index ?? 0);
  const currentTick = Number(pool.current_tick_index ?? 0);

  if (currentTick < lowerTick || currentTick > upperTick) return 1.0;
  return 0;
}

function formatTokenPair(coinA: string, coinB: string): string {
  const extract = (c: string) => c.split("::").pop() ?? c;
  return `${extract(coinA)}/${extract(coinB)}`;
}
