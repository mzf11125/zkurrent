/**
 * ZKurrent API Server — x402-Gated Agent Endpoints
 *
 * Hono HTTP server with x402 SUI micropayment middleware.
 * All paid endpoints require a valid SUI transaction digest
 * in the Authorization header: Authorization: x402 <tx-digest>
 *
 * Endpoints:
 *   POST /api/v1/proof/verify     — 0.01 SUI  — Verify ZK proof on Midnight
 *   GET  /api/v1/proof/:hash      — Free      — Check proof status
 *   GET  /api/v1/pools/latest     — 0.005 SUI — Latest pool screening data
 *   GET  /api/v1/pools/:id/history— Free      — Pool win/loss history
 *   GET  /api/v1/agent/status     — 0.005 SUI — Agent heartbeat + PnL
 *   GET  /api/v1/agent/health     — Free      — Health check
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { proofRoutes } from "./routes/proof.js";
import { poolRoutes } from "./routes/pools.js";
import { agentRoutes } from "./routes/agent.js";

const app = new Hono();

// ── Global Middleware ──

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Health Check (no x402) ──

app.get("/", (c) =>
  c.json({
    name: "ZKurrent API",
    version: "0.1.0",
    docs: "https://github.com/mzf11125/zkurrent",
    endpoints: {
      proofVerify: "POST /api/v1/proof/verify (0.01 SUI)",
      proofStatus: "GET /api/v1/proof/:hash (free)",
      poolsLatest: "GET /api/v1/pools/latest (0.005 SUI)",
      poolHistory: "GET /api/v1/pools/:poolId/history (free)",
      agentStatus: "GET /api/v1/agent/status (0.005 SUI)",
      agentHealth: "GET /api/v1/agent/health (free)",
    },
  })
);

// ── Route Mounting ──

app.route("/api/v1/proof", proofRoutes);
app.route("/api/v1/pools", poolRoutes);
app.route("/api/v1/agent", agentRoutes);

// ── 404 ──

app.notFound((c) =>
  c.json({ error: "Not Found", path: c.req.path }, 404)
);

// ── Error Handler ──

app.onError((err, c) =>
  c.json(
    { error: "Internal Server Error", message: err.message },
    500
  )
);

export { app };
export default app;
