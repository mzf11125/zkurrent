/**
 * Input Sanitization — Prompt Injection Defense
 *
 * Strips injection vectors from all untrusted data sources before
 * they reach the LLM prompt. Pool names, token pairs, whale event
 * data, and Sui Indexer results are all untrusted.
 */

const LLM_INJECTION_PATTERNS = [
  /ignore previous instructions/gi,
  /ignore all prior/gi,
  /system:\s*/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<\|system\|>/gi,
  /<\|user\|>/gi,
  /<\|assistant\|>/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<s>/gi,
  /<\/s>/gi,
];

const HTML_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<style[^>]*>.*?<\/style>/gi,
  /<[^>]+on\w+\s*=/gi,
  /javascript\s*:/gi,
  /data:text\/html/gi,
];

const ANSI_ESCAPE = /\x1b\[[0-9;]*m/g;

const MAX_STRING_LENGTH = 500;
const MAX_MULTILINE_LENGTH = 2000;

/**
 * Sanitize a single string field. Strips newlines, control characters,
 * LLM injection patterns, HTML, and ANSI escapes. Truncates to max length.
 */
export function sanitize(input: string, maxLen = MAX_STRING_LENGTH): string {
  if (!input || typeof input !== "string") return "";

  let cleaned = input;

  // Strip newlines and control characters
  cleaned = cleaned.replace(/[\n\r\t\0\v\f]/g, " ");
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, "");

  // Strip LLM injection patterns
  for (const pattern of LLM_INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[filtered]");
  }

  // Strip HTML injection
  for (const pattern of HTML_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Strip ANSI escape codes
  cleaned = cleaned.replace(ANSI_ESCAPE, "");

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  // Truncate
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen) + "...";
  }

  return cleaned.trim();
}

/**
 * Sanitize a multi-line block. Strips injection patterns but preserves
 * single newlines for structured data. Truncates to max length.
 */
export function sanitizeBlock(input: string, maxLen = MAX_MULTILINE_LENGTH): string {
  if (!input) return "";

  let cleaned = input;

  // Replace carriage returns and null bytes
  cleaned = cleaned.replace(/[\r\0\v\f]/g, "");

  // Strip LLM injection patterns
  for (const pattern of LLM_INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[filtered]");
  }

  // Strip HTML injection
  for (const pattern of HTML_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Strip ANSI escape codes
  cleaned = cleaned.replace(ANSI_ESCAPE, "");

  // Truncate
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen) + "\n...(truncated)";
  }

  return cleaned.trim();
}

/**
 * Sanitize a pool name for safe display and prompt injection.
 */
export function sanitizePoolName(name: string): string {
  return sanitize(name, 100);
}

/**
 * Sanitize a token pair string like "SUI/USDC".
 */
export function sanitizeTokenPair(pair: string): string {
  const cleaned = sanitize(pair, 50);
  // Enforce format: max 2 tokens separated by /
  if (!/^[\w.-]+\/[\w.-]+$/.test(cleaned)) {
    return cleaned.slice(0, 50);
  }
  return cleaned;
}

/**
 * Sanitize a whale event description from the Sui Indexer.
 */
export function sanitizeEventDetail(detail: string): string {
  return sanitize(detail, 200);
}

/**
 * Hash a prompt for audit trail.
 */
export async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
