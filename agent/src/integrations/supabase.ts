import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { PoolScore, PositionRecord, CycleOutcome, ZKProofRecord, AgentEvent } from "../types.js";

export function createSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

// ── Pool Metrics ──

export async function cachePoolMetrics(
  supabase: SupabaseClient,
  pools: PoolScore[]
): Promise<void> {
  const rows = pools.map((p) => ({
    pool_id: p.poolId,
    dex: p.dex,
    token_pair: p.tokenPair,
    tvl: p.tvl,
    volume_24h: p.volume24h,
    apy: p.apy,
    fees_24h: p.fees24h,
    volatility_24h: p.volatility24h ?? 0,
    score: p.score,
    rank: p.rank,
    scanned_at: p.scannedAt,
  }));

  const { error } = await supabase.from("pool_metrics").upsert(rows, {
    onConflict: "pool_id,scanned_at",
  });

  if (error) throw new Error(`Failed to cache pool metrics: ${error.message}`);
}

export async function getLatestPoolMetrics(
  supabase: SupabaseClient,
  dex?: string
): Promise<PoolScore[]> {
  let query = supabase
    .from("pool_metrics")
    .select("*")
    .order("scanned_at", { ascending: false })
    .order("score", { ascending: false });

  if (dex && dex !== "all") {
    query = query.eq("dex", dex);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch pool metrics: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    poolId: row.pool_id as string,
    dex: row.dex as PoolScore["dex"],
    tokenPair: row.token_pair as string,
    tvl: row.tvl as number,
    volume24h: row.volume_24h as number,
    apy: row.apy as number,
    fees24h: row.fees_24h as number,
    volatility24h: row.volatility_24h as number | undefined,
    score: row.score as number,
    rank: row.rank as number,
    scannedAt: row.scanned_at as string,
  }));
}

// ── Positions ──

export async function upsertPosition(
  supabase: SupabaseClient,
  position: PositionRecord
): Promise<void> {
  const { error } = await supabase.from("positions").upsert({
    position_id: position.positionId,
    pool_id: position.poolId,
    dex: position.dex,
    token_pair: position.tokenPair,
    amount_in: position.amountIn,
    amount_in_usd: position.amountInUsd,
    entry_price: position.entryPrice,
    current_price: position.currentPrice,
    exit_price: position.exitPrice,
    range_low: position.rangeLow,
    range_high: position.rangeHigh,
    fees_earned: position.feesEarned,
    impermanent_loss: position.impermanentLoss,
    net_pnl: position.netPnl,
    status: position.status,
    opened_at: position.openedAt,
    closed_at: position.closedAt,
    tx_digest: position.txDigest,
  });

  if (error) throw new Error(`Failed to upsert position: ${error.message}`);
}

export async function getActivePositions(
  supabase: SupabaseClient,
  owner: string
): Promise<PositionRecord[]> {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("status", "open");

  if (error) throw new Error(`Failed to fetch positions: ${error.message}`);

  return (data ?? []).map(mapPositionRow);
}

export async function getPositionHistory(
  supabase: SupabaseClient,
  limit = 50
): Promise<PositionRecord[]> {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .order("opened_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch position history: ${error.message}`);

  return (data ?? []).map(mapPositionRow);
}

function mapPositionRow(row: Record<string, unknown>): PositionRecord {
  return {
    positionId: row.position_id as string,
    poolId: row.pool_id as string,
    dex: row.dex as PositionRecord["dex"],
    tokenPair: row.token_pair as string,
    amountIn: row.amount_in as number,
    amountInUsd: row.amount_in_usd as number,
    entryPrice: row.entry_price as number,
    currentPrice: row.current_price as number | undefined,
    exitPrice: row.exit_price as number | undefined,
    rangeLow: row.range_low as number,
    rangeHigh: row.range_high as number,
    feesEarned: row.fees_earned as number,
    impermanentLoss: row.impermanent_loss as number,
    netPnl: row.net_pnl as number,
    status: row.status as PositionRecord["status"],
    openedAt: row.opened_at as string,
    closedAt: row.closed_at as string | undefined,
    txDigest: row.tx_digest as string | undefined,
  };
}

// ── Agent Events ──

export async function publishEvent(
  supabase: SupabaseClient,
  event: AgentEvent
): Promise<void> {
  const { error } = await supabase.from("agent_events").insert({
    event_type: event.type,
    payload: event,
  });

  if (error) throw new Error(`Failed to publish event: ${error.message}`);
}

// ── Learning Data ──

export async function recordCycleOutcome(
  supabase: SupabaseClient,
  outcome: CycleOutcome
): Promise<void> {
  const { error } = await supabase.from("learning_data").insert({
    cycle_id: outcome.cycleId,
    action: outcome.action,
    pool_id: outcome.poolId,
    dex: outcome.dex,
    fees_earned: outcome.feesEarned,
    impermanent_loss: outcome.impermanentLoss,
    net_pnl: outcome.netPnl,
    started_at: outcome.startedAt,
    completed_at: outcome.completedAt,
  });

  if (error) throw new Error(`Failed to record outcome: ${error.message}`);
}

export async function getPoolPerformance(
  supabase: SupabaseClient,
  poolId: string
): Promise<{ wins: number; losses: number; avgPnl: number }> {
  const { data, error } = await supabase
    .from("learning_data")
    .select("net_pnl")
    .eq("pool_id", poolId);

  if (error) throw new Error(`Failed to fetch pool performance: ${error.message}`);

  const trades = (data ?? []) as Array<{ net_pnl: number }>;
  const wins = trades.filter((t) => (t.net_pnl ?? 0) >= 0).length;
  const losses = trades.length - wins;
  const avgPnl = trades.length > 0
    ? trades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0) / trades.length
    : 0;

  return { wins, losses, avgPnl };
}

// ── ZK Proofs ──

export async function storeZKProof(
  supabase: SupabaseClient,
  proof: ZKProofRecord
): Promise<void> {
  const { error } = await supabase.from("zk_proofs").insert({
    proof_id: proof.proofId,
    proof_type: proof.proofType,
    proof_hash: proof.proofHash,
    midnight_block_hash: proof.midnightBlockHash,
    sui_tx_digest: proof.suiTxDigest,
    verified_at: proof.verifiedAt,
  });

  if (error) throw new Error(`Failed to store ZK proof: ${error.message}`);
}

// ── Strategy Config ──

export async function getStrategyConfig(supabase: SupabaseClient, owner: string) {
  const { data, error } = await supabase
    .from("strategy_configs")
    .select("*")
    .eq("owner", owner)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch strategy config: ${error.message}`);
  }

  return data ?? null;
}

// ── Realtime Subscription ──

export function subscribeToAgentEvents(
  supabase: SupabaseClient,
  onEvent: (event: AgentEvent) => void
) {
  return supabase
    .channel("agent-events")
    .on(
      "postgres_changes" as never,
      { event: "INSERT", schema: "public", table: "agent_events" },
      (payload: { new: { payload: AgentEvent } }) => {
        onEvent(payload.new.payload);
      }
    )
    .subscribe();
}
