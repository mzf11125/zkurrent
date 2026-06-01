/**
 * POST /api/v1/proof/verify
 *
 * Verify a ZK strategy compliance or performance proof on Midnight Network.
 * Requires x402 payment of 0.01 SUI.
 */

import { Hono } from "hono";
import { x402 } from "../middleware/x402.js";
import { verifyProofOnMidnight } from "../../integrations/midnight.js";
import { storeZKProof } from "../../integrations/supabase.js";
import { buildZKProofRecord } from "../../integrations/midnight.js";
import { createSupabaseClient } from "../../integrations/supabase.js";

const proofRoutes = new Hono();

proofRoutes.post("/verify", x402, async (c) => {
  try {
    const body = await c.req.json<{
      proofHash: string;
      proofType?: "strategy_compliance" | "performance";
      midnightBlockHash?: string;
    }>();

    if (!body.proofHash) {
      return c.json({ error: "Missing proofHash" }, 400);
    }

    const verification = await verifyProofOnMidnight(body.proofHash);

    const supabase = createSupabaseClient();
    const proofRecord = buildZKProofRecord({
      proofHash: body.proofHash,
      proofType: body.proofType ?? "strategy_compliance",
      midnightBlockHash: body.midnightBlockHash ?? verification.blockHeight?.toString(),
    });

    await storeZKProof(supabase, proofRecord);

    return c.json({
      verified: verification.verified,
      proofHash: body.proofHash,
      proofType: body.proofType ?? "strategy_compliance",
      midnightBlockHeight: verification.blockHeight,
      midnightTimestamp: verification.timestamp,
      suiTxDigest: proofRecord.suiTxDigest,
      verifiedAt: proofRecord.verifiedAt,
    });
  } catch (err) {
    return c.json(
      { error: "Proof verification failed", message: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});

// GET /api/v1/proof/:hash — Check proof status without payment reset
proofRoutes.get("/:hash", async (c) => {
  const hash = c.req.param("hash");
  const verification = await verifyProofOnMidnight(hash);

  return c.json({
    proofHash: hash,
    verified: verification.verified,
    blockHeight: verification.blockHeight,
    timestamp: verification.timestamp,
  });
});

export { proofRoutes };
