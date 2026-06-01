import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const closePositionTool = tool(
  async (input) => {
    return JSON.stringify({
      status: "queued",
      positionId: input.positionId,
      message: "Closing position. Execute via closeLPPosition().",
    });
  },
  {
    name: "close_position",
    description:
      "Close an existing LP position. Provide the position ID to close.",
    schema: z.object({
      positionId: z.string().describe("The position ID to close"),
    }),
  }
);
