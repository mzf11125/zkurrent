import { z } from "zod";

// ── Agent Cycle ──

export type CycleStatus = "idle" | "screening" | "deciding" | "executing" | "monitoring";

// ── Pool Screening ──

export type Dex = "deepbook" | "turbos" | "cetus" | "cetus_dlmm";

export const PoolScoreSchema = z.object({
  poolId: z.string(),
  dex: z.enum(["deepbook", "turbos", "cetus", "cetus_dlmm"]),
  tokenPair: z.string(),
  tvl: z.number(),
  volume24h: z.number(),
  apy: z.number(),
  fees24h: z.number(),
  volatility24h: z.number().optional(),
  score: z.number(),       // 0–100 composite score
  rank: z.number(),
  scannedAt: z.string(),
});
export type PoolScore = z.infer<typeof PoolScoreSchema>;

// ── Position Tracking ──

export const PositionRecordSchema = z.object({
  positionId: z.string(),
  poolId: z.string(),
  dex: z.enum(["deepbook", "turbos", "cetus", "cetus_dlmm"]),
  tokenPair: z.string(),
  amountIn: z.number(),
  amountInUsd: z.number(),
  entryPrice: z.number(),
  currentPrice: z.number().optional(),
  exitPrice: z.number().optional(),
  rangeLow: z.number(),
  rangeHigh: z.number(),
  feesEarned: z.number(),
  impermanentLoss: z.number(),
  netPnl: z.number(),
  status: z.enum(["open", "closed", "rebalanced"]),
  openedAt: z.string(),
  closedAt: z.string().optional(),
  txDigest: z.string().optional(),
});
export type PositionRecord = z.infer<typeof PositionRecordSchema>;

// ── Agent Config (mirrors on-chain AgentConfig) ──

export const AgentConfigSchema = z.object({
  owner: z.string(),
  riskTolerance: z.number().min(0).max(100),
  targetApyBps: z.number(),
  maxIlThresholdBps: z.number(),
  poolAllowlist: z.array(z.string()),
  poolBlocklist: z.array(z.string()),
  rebalanceIntervalMs: z.number(),
  isActive: z.boolean(),
  updatedAt: z.string(),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ── Agent Actions ──

export type AgentAction = "open" | "close" | "rebalance" | "hold" | "skip";

// ── Learning ──

export const CycleOutcomeSchema = z.object({
  cycleId: z.string(),
  action: z.enum(["open", "close", "rebalance", "hold", "skip"]),
  poolId: z.string().optional(),
  dex: z.enum(["deepbook", "turbos", "cetus", "cetus_dlmm"]).optional(),
  feesEarned: z.number().optional(),
  impermanentLoss: z.number().optional(),
  netPnl: z.number().optional(),
  startedAt: z.string(),
  completedAt: z.string(),
});
export type CycleOutcome = z.infer<typeof CycleOutcomeSchema>;

// ── ZK Proof ──

export const ZKProofRecordSchema = z.object({
  proofId: z.string(),
  proofType: z.enum(["strategy_compliance", "performance"]),
  proofHash: z.string(),
  midnightBlockHash: z.string().optional(),
  suiTxDigest: z.string().optional(),
  verifiedAt: z.string(),
});
export type ZKProofRecord = z.infer<typeof ZKProofRecordSchema>;

// ── Agent Event (SSE / Supabase Realtime) ──

export const AgentEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pool:screened"), poolCount: z.number(), topPool: z.string(), timestamp: z.string() }),
  z.object({ type: z.literal("position:opened"), poolId: z.string(),   dex: z.enum(["deepbook", "turbos", "cetus", "cetus_dlmm"]),
  tokenPair: z.string(), rangeLow: z.number(), rangeHigh: z.number(), txDigest: z.string(), timestamp: z.string() }),
  z.object({ type: z.literal("position:closed"), positionId: z.string(), fees: z.number(), il: z.number(), netPnl: z.number(), txDigest: z.string(), timestamp: z.string() }),
  z.object({ type: z.literal("position:rebalanced"), oldPositionId: z.string(), newPoolId: z.string(), reason: z.string(), timestamp: z.string() }),
  z.object({ type: z.literal("zk:proof_generated"), proofType: z.enum(["strategy_compliance", "performance"]), proofHash: z.string(), timestamp: z.string() }),
  z.object({ type: z.literal("agent:heartbeat"), status: z.enum(["healthy", "error", "paused"]), activePositions: z.number(), tvl: z.number(), cumulativePnl: z.number(), timestamp: z.string() }),
  z.object({ type: z.literal("agent:error"), code: z.string(), message: z.string(), timestamp: z.string() }),
]);
export type AgentEvent = z.infer<typeof AgentEventSchema>;

// ── LangGraph Agent State ──

import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  cycleStatus: Annotation<CycleStatus>,
  screenedPools: Annotation<PoolScore[]>,
  activePositions: Annotation<PositionRecord[]>,
  config: Annotation<AgentConfig | null>,
  selectedAction: Annotation<AgentAction | null>,
  selectedPool: Annotation<PoolScore | null>,
  targetPosition: Annotation<PositionRecord | null>,
  currentCycle: Annotation<number>,
  cycleHistory: Annotation<CycleOutcome[]>,
  lastError: Annotation<string | null>,
});
