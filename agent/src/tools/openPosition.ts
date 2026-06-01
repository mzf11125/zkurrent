import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { openLPPosition } from "../integrations/sui.js";
import type { PoolScore, AgentConfig } from "../types.js";

export const openPositionTool = tool(
  async (input, config) => {
    // In production: config contains SuiClient + keypair via configurable
    return JSON.stringify({
      status: "queued",
      pool: input.poolId,
      dex: input.dex,
      tokenPair: input.tokenPair,
      message: `Opening position on ${input.dex} ${input.tokenPair}. Execute via openLPPosition().`,
    });
  },
  {
    name: "open_position",
    description:
      "Open a new LP position on a selected pool. Requires pool ID, DEX name, and token pair.",
    schema: z.object({
      poolId: z.string().describe("The pool ID to open position on"),
      dex: z.enum(["deepbook", "turbos", "cetus", "cetus_dlmm"]).describe("The DEX to use"),
      tokenPair: z.string().describe("Token pair, e.g. SUI/USDC"),
    }),
  }
);
