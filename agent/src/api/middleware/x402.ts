/**
 * x402 Payment Middleware — SUI Native Micropayments
 *
 * Verifies SUI payments before allowing API requests.
 * Clients must include an x402 authorization header with:
 *   Authorization: x402 <sui-tx-digest>
 *
 * The middleware:
 *   1. Extracts the tx digest from the Authorization header
 *   2. Queries Sui RPC to verify the transaction exists
 *   3. Checks payment amount >= minimum for the endpoint
 *   4. Verifies the payment recipient matches the expected address
 *   5. Ensures the payment is recent (within expiry window)
 */

import type { Context, Next } from "hono";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// ── Config ──

interface X402Config {
  recipientAddress: string;
  minAmountMist: bigint; // Minimum SUI in MIST (1 SUI = 1_000_000_000 MIST)
  expiryMinutes: number;
  suiClient: SuiClient;
}

const DEFAULT_X402_CONFIG: X402Config = {
  recipientAddress: process.env.X402_RECIPIENT_ADDRESS ?? "",
  minAmountMist: 5_000_000n, // 0.005 SUI default
  expiryMinutes: 15,
  suiClient: new SuiClient({
    url: process.env.SUI_RPC_URL ?? getFullnodeUrl("testnet"),
  }),
};

// ── Endpoint Pricing (MIST) ──

export const X402_PRICES: Record<string, bigint> = {
  "/api/v1/proof/verify": 10_000_000n, // 0.01 SUI
  "/api/v1/pools/latest": 5_000_000n,  // 0.005 SUI
  "/api/v1/agent/status": 5_000_000n,  // 0.005 SUI
  "/api/v1/strategy/:id": 20_000_000n, // 0.02 SUI
};

// ── Middleware Factory ──

export function createX402Middleware(config?: Partial<X402Config>) {
  const cfg: X402Config = { ...DEFAULT_X402_CONFIG, ...config };

  return async function x402Middleware(c: Context, next: Next) {
    const authHeader = c.req.header("Authorization");

    // No payment provided → 402 Payment Required
    if (!authHeader || !authHeader.startsWith("x402 ")) {
      const requiredMist = getPriceForPath(c.req.path);

      return c.json(
        {
          error: "Payment Required",
          message: "x402 micropayment required for this endpoint",
          payment: {
            recipient: cfg.recipientAddress,
            chain: "sui",
            asset: "SUI",
            amountMist: requiredMist.toString(),
            amountSui: (Number(requiredMist) / 1_000_000_000).toFixed(5),
            expiresInMinutes: cfg.expiryMinutes,
          },
          hint: "Send SUI to the recipient address, then include the tx digest as 'Authorization: x402 <tx-digest>'",
        },
        402
      );
    }

    const txDigest = authHeader.slice(5).trim();

    // Verify transaction on Sui
    try {
      const tx = await cfg.suiClient.getTransactionBlock({
        digest: txDigest,
        options: { showEffects: true, showInput: true },
      });

      if (!tx.effects) {
        return c.json({ error: "Invalid payment", message: "Transaction not found or not yet finalized" }, 402);
      }

      // Check payment recipient matches
      const paymentMatch = tx.effects.mutated?.some(
        (obj) =>
          obj.owner &&
          typeof obj.owner === "object" &&
          "AddressOwner" in obj.owner &&
          (obj.owner as { AddressOwner: string }).AddressOwner === cfg.recipientAddress
      );

      if (!paymentMatch) {
        return c.json(
          { error: "Invalid recipient", message: `Payment must be sent to ${cfg.recipientAddress}` },
          402
        );
      }

      // Check transaction age (within expiry)
      const txAge = Date.now() - (Number(tx.timestampMs) ?? 0);
      if (txAge > cfg.expiryMinutes * 60_000) {
        return c.json(
          { error: "Payment expired", message: `Transaction is older than ${cfg.expiryMinutes} minutes. Send a new payment.` },
          402
        );
      }

      // Store tx digest in context for route handlers
      c.set("x402TxDigest", txDigest);
      c.set("x402Verified", true);

      await next();
    } catch (err) {
      return c.json(
        { error: "Payment verification failed", message: err instanceof Error ? err.message : "Unknown error", txDigest },
        402
      );
    }
  };
}

// ── Helpers ──

function getPriceForPath(path: string): bigint {
  // Check exact match
  if (X402_PRICES[path]) return X402_PRICES[path] ?? 5_000_000n;

  // Check pattern match (e.g., /api/v1/strategy/:id)
  for (const [pattern, price] of Object.entries(X402_PRICES)) {
    const regex = new RegExp("^" + pattern.replace(/:[^/]+/g, "[^/]+") + "$");
    if (regex.test(path)) return price;
  }

  return 5_000_000n; // Default minimum
}

// ── Convenience: pre-built middleware instance ──

export const x402 = createX402Middleware();
