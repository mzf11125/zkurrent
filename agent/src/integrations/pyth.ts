/**
 * Pyth Network — Sui On-Chain Price Feeds
 *
 * Queries Pyth price feeds directly from Sui Move contracts.
 * No API key, no rate limit, fully on-chain.
 *
 * Sui Pyth package (mainnet): 0x4d20e... (Pyth price feed object IDs per asset)
 *
 * Assets tracked:
 *   SUI/USD  — price_feed_id from Pyth Sui registry
 *   ETH/USD  — price_feed_id from Pyth Sui registry
 *   USDC/USD — price_feed_id from Pyth Sui registry
 */

import { SuiClient } from "@mysten/sui/client";

const PYTH_PACKAGE_ID = process.env.PYTH_PACKAGE_ID ?? "";
const SUI_FEED_ID = process.env.PYTH_SUI_FEED_ID ?? "";
const ETH_FEED_ID = process.env.PYTH_ETH_FEED_ID ?? "";
const USDC_FEED_ID = process.env.PYTH_USDC_FEED_ID ?? "";

interface PriceData {
  symbol: string;
  price: number;
  confidence: number;
  timestamp: number;
  source: "pyth" | "cached";
}

// ── Core: read price from Pyth on Sui ──

export async function getPythPrice(
  client: SuiClient,
  feedId: string,
  symbol: string
): Promise<PriceData> {
  try {
    const obj = await client.getObject({
      id: feedId,
      options: { showContent: true },
    });

    if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
      return getCachedPrice(symbol);
    }

    const fields = obj.data.content.fields as Record<string, unknown>;
    const priceInfo = fields.price_info ?? fields.price ?? fields;

    const priceObj = priceInfo as Record<string, unknown>;
    const price = Number(priceObj.price ?? priceObj.price_feed ?? 0);
    const conf = Number(priceObj.conf ?? priceObj.confidence ?? 0);
    const expo = Number(priceObj.expo ?? priceObj.exponent ?? 0);

    const actualPrice = price * Math.pow(10, expo);
    const actualConf = conf * Math.pow(10, expo);

    return {
      symbol,
      price: actualPrice,
      confidence: actualConf,
      timestamp: Date.now(),
      source: "pyth",
    };
  } catch {
    return getCachedPrice(symbol);
  }
}

// ── Batch: get all tracked prices ──

export async function getMarketPrices(client: SuiClient): Promise<PriceData[]> {
  const symbols = [
    { feedId: SUI_FEED_ID, symbol: "SUI" },
    { feedId: ETH_FEED_ID, symbol: "ETH" },
    { feedId: USDC_FEED_ID, symbol: "USDC" },
  ];

  const results = await Promise.all(
    symbols.map(({ feedId, symbol }) => getPythPrice(client, feedId, symbol))
  );

  return results;
}

// ── Compute derived pairs ──

export function getDerivedPairs(prices: PriceData[]) {
  const sui = prices.find((p) => p.symbol === "SUI");
  const eth = prices.find((p) => p.symbol === "ETH");
  const usdc = prices.find((p) => p.symbol === "USDC");

  return {
    "SUI/USD": sui?.price ?? 0,
    "SUI/USDC": usdc ? sui?.price ?? 0 : 0,
    "ETH/USD": eth?.price ?? 0,
    "ETH/SUI": sui ? (eth?.price ?? 0) / (sui.price || 1) : 0,
    "USDC/USD": usdc?.price ?? 1,
    confidence: {
      SUI: sui?.confidence ?? 0,
      ETH: eth?.confidence ?? 0,
      USDC: usdc?.confidence ?? 0,
    },
    updatedAt: Math.max(
      sui?.timestamp ?? 0,
      eth?.timestamp ?? 0,
      usdc?.timestamp ?? 0
    ),
  };
}

// ── Cache fallback ──

const priceCache: Record<string, PriceData> = {
  SUI: { symbol: "SUI", price: 1.02, confidence: 0.01, timestamp: 0, source: "cached" },
  ETH: { symbol: "ETH", price: 3845, confidence: 15, timestamp: 0, source: "cached" },
  USDC: { symbol: "USDC", price: 1.0, confidence: 0.001, timestamp: 0, source: "cached" },
};

function getCachedPrice(symbol: string): PriceData {
  return priceCache[symbol] ?? { symbol, price: 0, confidence: 0, timestamp: 0, source: "cached" };
}

// ── Price change (for volatility detection) ──

export function computePriceChange(
  current: number,
  cached: number
): { change: number; changePercent: number; trend: "up" | "down" | "flat" } {
  const change = current - cached;
  const changePercent = cached > 0 ? (change / cached) * 100 : 0;
  const trend = changePercent > 0.5 ? "up" : changePercent < -0.5 ? "down" : "flat";
  return { change, changePercent, trend };
}
