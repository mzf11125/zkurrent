/**
 * Decision Log — Immutable Audit Trail
 *
 * Every agent decision is recorded with prompt hash, LLM raw output,
 * guard validation result, and on-chain execution status.
 *
 * The audit log is append-only. No UPDATE, no DELETE.
 * Postgres RLS on Supabase enforces immutability.
 */

import { createSupabaseClient } from "../integrations/supabase.js";

export interface DecisionRecord {
  cycleId: string;
  promptHash: string | null;
  llmRawOutput: string | null;
  parsedAction: string;
  guardPassed: boolean;
  guardViolation: string | null;
  executedOnChain: boolean;
  suiTxDigest: string | null;
  timestamp: string;
}

export async function recordDecision(record: DecisionRecord): Promise<void> {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase.from("decision_log").insert({
      cycle_id: record.cycleId,
      prompt_hash: record.promptHash,
      llm_raw_output: record.llmRawOutput,
      parsed_action: record.parsedAction,
      guard_passed: record.guardPassed,
      guard_violation: record.guardViolation,
      executed_on_chain: record.executedOnChain,
      sui_tx_digest: record.suiTxDigest,
      timestamp: record.timestamp,
    });

    if (error) {
      console.error("Failed to record decision:", error.message);
    }
  } catch (err) {
    // Audit failure must not break the agent loop
    console.error("Audit log failure:", err);
  }
}

export async function getRecentDecisions(limit = 20): Promise<DecisionRecord[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("decision_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) return [];

    return (data ?? []).map((row: Record<string, unknown>) => ({
      cycleId: row.cycle_id as string,
      promptHash: row.prompt_hash as string | null,
      llmRawOutput: row.llm_raw_output as string | null,
      parsedAction: row.parsed_action as string,
      guardPassed: row.guard_passed as boolean,
      guardViolation: row.guard_violation as string | null,
      executedOnChain: row.executed_on_chain as boolean,
      suiTxDigest: row.sui_tx_digest as string | null,
      timestamp: row.timestamp as string,
    }));
  } catch {
    return [];
  }
}

export async function getFailedDecisions(limit = 10): Promise<DecisionRecord[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("decision_log")
      .select("*")
      .eq("guard_passed", false)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) return [];

    return (data ?? []).map((row: Record<string, unknown>) => ({
      cycleId: row.cycle_id as string,
      promptHash: row.prompt_hash as string | null,
      llmRawOutput: row.llm_raw_output as string | null,
      parsedAction: row.parsed_action as string,
      guardPassed: false,
      guardViolation: row.guard_violation as string | null,
      executedOnChain: false,
      suiTxDigest: null,
      timestamp: row.timestamp as string,
    }));
  } catch {
    return [];
  }
}
