/**
 * ZKurrent MCP Server
 *
 * Model Context Protocol server exposing ZKurrent's tools to AI agents.
 * Claude Desktop, Cursor, Codex, and other MCP-compatible agents can
 * discover and call ZKurrent's ZK-shielded execution rails natively.
 *
 * Tools exposed:
 *   - screen_pools: Screen all LP pools across 4 DEXes (top 10 ranked)
 *   - verify_proof: Verify ZK strategy proof on Midnight Network
 *   - get_agent_status: Agent heartbeat (positions, PnL, TVL)
 *   - get_pool_history: Win/loss + average PnL per pool
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { screenPools } from "../tools/screenPools.js";
import { verifyProofOnMidnight, buildZKProofRecord } from "../integrations/midnight.js";
import { createSupabaseClient, getActivePositions, getPoolPerformance } from "../integrations/supabase.js";

const supabase = createSupabaseClient();

const server = new Server(
  { name: "zkurrent", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ── Tool Definitions ──

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "screen_pools",
      description:
        "Screen all liquidity pools across DeepBook, Cetus CLMM, Cetus DLMM, and Turbos on Sui. Returns top 10 pools ranked by composite score (TVL + volume + APY). Each pool includes dex, token pair, TVL, volume, APY, fees, and score.",
      inputSchema: {
        type: "object",
        properties: {
          dex: {
            type: "string",
            enum: ["all", "deepbook", "turbos", "cetus", "cetus_dlmm"],
            description: "Filter by DEX. Default: all",
          },
        },
      },
    },
    {
      name: "verify_proof",
      description:
        "Verify a ZK strategy compliance or performance proof on Midnight Network. Returns whether the proof exists on the Midnight ledger.",
      inputSchema: {
        type: "object",
        properties: {
          proofHash: {
            type: "string",
            description: "SHA-256 hash of the ZK proof to verify",
          },
        },
        required: ["proofHash"],
      },
    },
    {
      name: "get_agent_status",
      description:
        "Get the current ZKurrent agent heartbeat: status (active/paused), active positions count, total TVL, cumulative PnL, target APY, and max IL threshold.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_pool_history",
      description:
        "Get historical win/loss record and average PnL for a specific liquidity pool. Helps AI agents learn which pools perform best.",
      inputSchema: {
        type: "object",
        properties: {
          poolId: {
            type: "string",
            description: "Pool ID to query history for (e.g., deepbook-sui-usdc)",
          },
        },
        required: ["poolId"],
      },
    },
  ],
}));

// ── Tool Handlers ──

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "screen_pools": {
        const dex = (args as { dex?: string }).dex ?? "all";
        const pools = await screenPools();
        const filtered = dex === "all" ? pools : pools.filter((p) => p.dex === dex);
        const top10 = filtered.slice(0, 10);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: top10.length,
                  scannedAt: top10[0]?.scannedAt ?? new Date().toISOString(),
                  pools: top10.map((p) => ({
                    poolId: p.poolId,
                    dex: p.dex,
                    tokenPair: p.tokenPair,
                    tvl: `$${(p.tvl / 1_000_000).toFixed(1)}M`,
                    volume24h: `$${(p.volume24h / 1000).toFixed(0)}K`,
                    apy: `${p.apy.toFixed(1)}%`,
                    score: p.score,
                    rank: p.rank,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "verify_proof": {
        const { proofHash } = args as { proofHash: string };
        const verification = await verifyProofOnMidnight(proofHash);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  proofHash,
                  verified: verification.verified,
                  blockHeight: verification.blockHeight,
                  timestamp: verification.timestamp,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_agent_status": {
        const activePositions = await getActivePositions(supabase, "agent");
        const tvl = activePositions.reduce((sum, p) => sum + p.amountInUsd, 0);
        const cumulativePnl = activePositions.reduce((sum, p) => sum + p.netPnl, 0);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  activePositions: activePositions.length,
                  tvl,
                  cumulativePnl,
                  status: "active",
                  lastUpdated: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_pool_history": {
        const { poolId } = args as { poolId: string };
        const perf = await getPoolPerformance(supabase, poolId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  poolId,
                  wins: perf.wins,
                  losses: perf.losses,
                  winRate:
                    perf.wins + perf.losses > 0
                      ? Math.round((perf.wins / (perf.wins + perf.losses)) * 100)
                      : 0,
                  avgPnl: perf.avgPnl,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
        },
      ],
      isError: true,
    };
  }
});

// ── Start MCP Server ──

async function start() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ZKurrent MCP server running on stdio");
}

start().catch(console.error);
