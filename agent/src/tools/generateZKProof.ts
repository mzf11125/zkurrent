import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { generateStrategyProof } from "../integrations/midnight.js";

export const generateZKProofTool = tool(
  async (input) => {
    try {
      const result = await generateStrategyProof({
        configHash: input.configHash,
        positions: [],
        maxIlThreshold: input.maxIlThreshold,
      });

      return JSON.stringify({
        status: "success",
        proofHash: result.proofHash,
        midnightBlockHash: result.midnightBlockHash,
        message: "ZK proof generated on Midnight Network. Proof hash relayed to Sui.",
      });
    } catch (err) {
      return JSON.stringify({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown proof error",
      });
    }
  },
  {
    name: "generate_zk_proof",
    description:
      "Generate a ZK attestation on Midnight Network proving the agent followed the configured strategy parameters. Returns a proof hash that is relayed to Sui.",
    schema: z.object({
      configHash: z.string().describe("SHA-256 hash of the AgentConfig"),
      maxIlThreshold: z.number().describe("Maximum IL threshold in basis points"),
    }),
  }
);
