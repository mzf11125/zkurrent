/**
 * Cetus DLMM SDK Integration
 *
 * @cetusprotocol/dlmm-sdk v1.2.9
 * DLMM (Dynamic Liquidity Market Maker) — multi-bin liquidity positions.
 * Different from CLMM: uses discrete bins instead of continuous price ranges.
 *
 * DLMM mainnet package: 0x5664f9d3fd82c84023870cfbda8ea84e14c8dd56ce557ad2116e0668581a682b
 * DLMM testnet package: 0xb382224d12558da5f87624765065a8c7e8f5c899d0ee890610e2bb4e8c686be9
 */

import { DLMMSDK, StrategyType } from "@cetusprotocol/dlmm-sdk";
import type { PoolScore, PositionRecord } from "../types.js";

let sdk: DLMMSDK | null = null;

function getSDK(): DLMMSDK {
  if (!sdk) {
    sdk = new DLMMSDK({
      network: (process.env.SUI_NETWORK as "mainnet" | "testnet") ?? "testnet",
      fullRpcUrl: process.env.SUI_RPC_URL,
    });
  }
  return sdk;
}

// ── Pool Screening ──

export async function screenCetusDlmmPools(): Promise<PoolScore[]> {
  try {
    const sdk = getSDK();
    const pools = await sdk.Pool.getPoolsWithPage([]);
    const scored: PoolScore[] = [];

    for (const pool of pools.slice(0, 20)) {
      const detailed = await sdk.Pool.getPool(pool.pool_id);
      const tvl = computeDLMMTVL(detailed);
      const volume24h = Number(detailed.volume_24h ?? 0);
      const fees24h = Number(detailed.fee_volume_24h ?? 0);
      const apy = calculateAPY(fees24h, tvl);

      scored.push({
        poolId: detailed.pool_id,
        dex: "cetus_dlmm",
        tokenPair: formatTokenPair(detailed.coin_type_a, detailed.coin_type_b),
        tvl,
        volume24h,
        apy,
        fees24h,
        volatility24h: computeVolatility(detailed),
        score: 0,
        rank: 0,
        scannedAt: new Date().toISOString(),
      });
    }

    return scored;
  } catch (err) {
    console.error("Cetus DLMM screening failed:", err);
    return [];
  }
}

// ── Open DLMM Position ──

export async function openDlmmPosition(params: {
  poolId: string;
  coinTypeA: string;
  coinTypeB: string;
  amountA: bigint;
  amountB: bigint;
  slippage: number;
  binCount: number; // number of bins to spread across
  keypair: unknown;
}): Promise<{ txDigest: string; positionId: string }> {
  const sdk = getSDK();
  const pool = await sdk.Pool.getPool(params.poolId);

  const activeId = Number(pool.active_id);
  const binStep = Number(pool.bin_step);
  const lowerBinId = activeId - params.binCount;
  const upperBinId = activeId + params.binCount;

  const activeBinAmounts = await sdk.Position.getActiveBinIfInRange(
    pool.bin_manager.bin_manager_handle,
    lowerBinId,
    upperBinId,
    activeId,
    binStep
  );

  const binInfos = await sdk.Position.calculateAddLiquidityInfo({
    pool_id: params.poolId,
    amount_a: params.amountA.toString(),
    amount_b: params.amountB.toString(),
    active_id: activeId,
    bin_step: binStep,
    lower_bin_id: lowerBinId,
    upper_bin_id: upperBinId,
    active_bin_of_pool: activeBinAmounts,
    strategy_type: StrategyType.Spot,
  });

  const tx = sdk.Position.addLiquidityPayload({
    pool_id: params.poolId,
    bin_infos: binInfos,
    coin_type_a: params.coinTypeA,
    coin_type_b: params.coinTypeB,
    lower_bin_id: lowerBinId,
    upper_bin_id: upperBinId,
    active_id: activeId,
    strategy_type: StrategyType.Spot,
    use_bin_infos: false,
    max_price_slippage: params.slippage,
    bin_step: binStep,
  });

  const result = await sdk.fullClient.sendTransaction(
    params.keypair as never,
    tx as never
  );

  return {
    txDigest: result.digest,
    positionId: `${params.poolId}-dlmm-${Date.now()}`,
  };
}

// ── Close DLMM Position ──

export async function closeDlmmPosition(params: {
  positionId: string;
  poolId: string;
  coinTypeA: string;
  coinTypeB: string;
  binIds: number[];
  amounts: string[];
  slippage: number;
  keypair: unknown;
}): Promise<{ txDigest: string }> {
  const sdk = getSDK();

  const tx = await sdk.Position.removeLiquidityPayload({
    pool_id: params.poolId,
    position_id: params.positionId,
    coin_type_a: params.coinTypeA,
    coin_type_b: params.coinTypeB,
    bin_ids: params.binIds,
    amounts: params.amounts,
    max_price_slippage: params.slippage,
    strategy_type: StrategyType.Spot,
  });

  const result = await sdk.fullClient.sendTransaction(
    params.keypair as never,
    tx as never
  );

  return { txDigest: result.digest };
}

// ── Position Queries ──

export async function getDlmmPositions(): Promise<PositionRecord[]> {
  try {
    const sdk = getSDK();
    const pools = await sdk.Pool.getPoolsWithPage([]);
    const records: PositionRecord[] = [];

    for (const pool of pools.slice(0, 20)) {
      const positions = await sdk.Pool.getPositionList(
        pool.bin_manager.positions_handle
      );

      for (const pos of positions) {
        records.push({
          positionId: pos.position_id ?? "",
          poolId: pool.pool_id,
          dex: "cetus_dlmm",
          tokenPair: formatTokenPair(pool.coin_type_a, pool.coin_type_b),
          amountIn: Number(pos.liquidity ?? 0),
          amountInUsd: 0,
          entryPrice: Number(pos.lower_bin_id ?? 0),
          currentPrice: Number(pool.active_id),
          exitPrice: undefined,
          rangeLow: Number(pos.lower_bin_id ?? 0),
          rangeHigh: Number(pos.upper_bin_id ?? 0),
          feesEarned: Number(pos.fee_growth ?? 0),
          impermanentLoss: computeDlmmIL(pos, pool),
          netPnl: Number(pos.fee_growth ?? 0) - computeDlmmIL(pos, pool),
          status: "open",
          openedAt: new Date(Date.now()).toISOString(),
        });
      }
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

function computeDLMMTVL(pool: Record<string, unknown>): number {
  return Number(pool.tvl ?? 0);
}

function computeVolatility(pool: Record<string, unknown>): number {
  return Number(pool.volatility_24h ?? 0);
}

function computeDlmmIL(
  pos: Record<string, unknown>,
  pool: Record<string, unknown>
): number {
  const lowerBin = Number(pos.lower_bin_id ?? 0);
  const upperBin = Number(pos.upper_bin_id ?? 0);
  const activeBin = Number(pool.active_id ?? 0);

  if (activeBin < lowerBin || activeBin > upperBin) return 1.0;
  const range = upperBin - lowerBin || 1;
  const distFromCenter = Math.abs(activeBin - (lowerBin + upperBin) / 2) / range;
  return distFromCenter * 0.1;
}

function formatTokenPair(coinA: string, coinB: string): string {
  const extract = (c: string) => c.split("::").pop() ?? c;
  return `${extract(coinA)}/${extract(coinB)}`;
}
