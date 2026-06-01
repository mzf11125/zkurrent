# ZKurrent API Reference

> x402-gated ZK-shielded execution rails for AI agents and developers.
> Pay-per-use in SUI. No API keys. No sign-ups. Machine-to-machine economy.

Base URL: `https://api.zkurrent.xyz`

---

## Authentication — x402 Micropayment Protocol

Every paid endpoint requires a SUI transaction before the request. No API key, no JWT, no sign-up.

### Payment Flow

```
1. Client requests endpoint → server returns 402 Payment Required
2. Client sends SUI to ZKURRENT_ADDRESS (on Sui testnet)
3. Client includes tx digest in header: Authorization: x402 <tx-digest>
4. Server verifies tx on-chain (amount, recipient, expiry)
5. Server processes request → returns 200 with data
```

### Payment Requirements

| Field | Value |
|-------|-------|
| Chain | Sui (testnet/mainnet) |
| Asset | SUI (native coin) |
| Payment address | `SUI_ADDRESS` (configured by operator) |
| Expiry window | 15 minutes from tx timestamp |
| Minimum confirmations | 1 |

### Authorization Header Format

```
Authorization: x402 <sui-transaction-digest>
```

Example:
```
Authorization: x402 5Vx...longtxdigest...abc123
```

---

## Pricing

| Endpoint | Method | Price (SUI) | Price (USD~) |
|----------|--------|-------------|-------------|
| `/api/v1/proof/verify` | POST | 0.01 SUI | ~$0.01 |
| `/api/v1/pools/latest` | GET | 0.005 SUI | ~$0.005 |
| `/api/v1/agent/status` | GET | 0.005 SUI | ~$0.005 |
| `/api/v1/agent/position-history` | GET | 0.005 SUI | ~$0.005 |
| `/api/v1/proof/:hash` | GET | **Free** | — |
| `/api/v1/agent/health` | GET | **Free** | — |
| `/api/v1/pools/:poolId/history` | GET | **Free** | — |

---

## Endpoints

### POST /api/v1/proof/verify

Verify a ZK strategy compliance or performance proof on Midnight Network.

**Price**: 0.01 SUI

**Request Body**:
```json
{
  "proofHash": "abc123...",
  "proofType": "strategy_compliance",
  "midnightBlockHash": "0x..."
}
```

**Response (200)**:
```json
{
  "verified": true,
  "proofHash": "abc123...",
  "proofType": "strategy_compliance",
  "midnightBlockHeight": 1234567,
  "midnightTimestamp": "2026-06-01T12:00:00Z",
  "verifiedAt": "2026-06-01T12:00:01Z"
}
```

**Response (402 — missing payment)**:
```json
{
  "error": "Payment Required",
  "message": "x402 micropayment required for this endpoint",
  "payment": {
    "recipient": "0x...",
    "chain": "sui",
    "asset": "SUI",
    "amountMist": "10000000",
    "amountSui": "0.01000",
    "expiresInMinutes": 15
  },
  "hint": "Send SUI to the recipient address, then include the tx digest as 'Authorization: x402 <tx-digest>'"
}
```

**Error Codes**:

| Status | Code | Meaning |
|--------|------|---------|
| 400 | `MISSING_PROOF_HASH` | `proofHash` field is required |
| 402 | `PAYMENT_REQUIRED` | No x402 authorization header |
| 402 | `INVALID_PAYMENT` | Transaction not found or not finalized |
| 402 | `INVALID_RECIPIENT` | Payment sent to wrong address |
| 402 | `PAYMENT_EXPIRED` | Transaction older than 15 minutes |
| 500 | `VERIFICATION_FAILED` | Midnight Indexer unreachable |

---

### GET /api/v1/pools/latest

Returns the latest pool screening results from Supabase cache.

**Price**: 0.005 SUI

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `dex` | string | `all` | Filter by DEX (`deepbook`, `turbos`, `cetus`, `cetus_dlmm`, `all`) |
| `limit` | integer | 20 | Max pools to return (1–100) |

**Response (200)**:
```json
{
  "source": "cache",
  "count": 2,
  "scannedAt": "2026-06-01T11:55:00Z",
  "pools": [
    {
      "poolId": "deepbook-sui-usdc",
      "dex": "deepbook",
      "tokenPair": "SUI/USDC",
      "tvl": 12500000,
      "volume24h": 842000,
      "apy": 14.2,
      "fees24h": 1200,
      "score": 94,
      "rank": 1,
      "scannedAt": "2026-06-01T11:55:00Z"
    },
    {
      "poolId": "cetus-sui-usdc-dlmm",
      "dex": "cetus_dlmm",
      "tokenPair": "SUI/USDC",
      "tvl": 5100000,
      "volume24h": 310000,
      "apy": 18.5,
      "fees24h": 1550,
      "score": 82,
      "rank": 2,
      "scannedAt": "2026-06-01T11:55:00Z"
    }
  ]
}
```

**Notes**:
- Data is cached from the last agent screening cycle (every 5 minutes)
- If cache is empty, triggers a fresh screening (source: `"fresh"`)
- Filter by DEX to get only DeepBook, only Cetus, etc.

---

### GET /api/v1/agent/status

Returns the current agent heartbeat: positions, PnL, strategy config.

**Price**: 0.005 SUI

**Response (200)**:
```json
{
  "status": "active",
  "activePositions": 7,
  "tvl": 842000,
  "cumulativePnl": 4250.50,
  "targetApy": "15.0%",
  "maxIL": "5.0%",
  "lastUpdated": "2026-06-01T12:00:00Z"
}
```

---

### GET /api/v1/agent/position-history

Returns the agent's closed LP position history.

**Price**: 0.005 SUI

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 20 | Max positions to return (1–100) |

**Response (200)**:
```json
{
  "count": 12,
  "positions": [
    {
      "positionId": "pos-4",
      "poolId": "deepbook-btc-sui",
      "dex": "deepbook",
      "tokenPair": "BTC/SUI",
      "feesEarned": 145.30,
      "impermanentLoss": 20.10,
      "netPnl": 125.20,
      "status": "closed",
      "openedAt": "2026-05-30T10:00:00Z",
      "closedAt": "2026-06-01T08:00:00Z"
    }
  ]
}
```

---

### GET /api/v1/agent/health

Simple health check. No authentication required.

**Price**: Free

**Response (200)**:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 3600.5,
  "timestamp": "2026-06-01T12:00:00Z"
}
```

---

### GET /api/v1/proof/:hash

Check the status of a ZK proof by hash. No authentication required.

**Price**: Free

**Response (200)**:
```json
{
  "proofHash": "abc123...",
  "verified": true,
  "blockHeight": 1234567,
  "timestamp": "2026-06-01T12:00:00Z"
}
```

---

### GET /api/v1/pools/:poolId/history

Get historical win/loss and average PnL for a pool. No authentication required.

**Price**: Free

**Response (200)**:
```json
{
  "poolId": "deepbook-sui-usdc",
  "wins": 15,
  "losses": 3,
  "winRate": 83,
  "avgPnl": 320.50
}
```

---

## MCP Server (AI Agent Integration)

ZKurrent exposes a Model Context Protocol server so AI agents (Claude Desktop, Cursor, Codex, etc.) can discover and call ZKurrent tools natively.

### Available MCP Tools

| Tool | Description | x402? |
|------|-------------|-------|
| `screen_pools` | Screen all liquidity pools across 4 DEXes. Returns top 10 ranked by composite score. | No (server-side paid by operator) |
| `verify_proof` | Verify a ZK strategy compliance proof on Midnight Network. | No |
| `get_agent_status` | Get current agent heartbeat: positions, PnL, TVL. | No |
| `get_pool_history` | Get win/loss and average PnL for a specific pool. | No |

### MCP Server Usage (Claude Desktop)

```json
{
  "mcpServers": {
    "zkurrent": {
      "command": "npx",
      "args": ["-y", "@zkurrent/mcp"]
    }
  }
}
```

### MCP Server Usage (Codex/Cursor)

```
npx @zkurrent/mcp
```

The MCP server runs on `http://localhost:4021/sse` with an SSE transport.
AI agents discover tools via the standard MCP `tools/list` handshake.

---

## SDK (TypeScript — Phase 2)

### Installation

```bash
npm install @zkurrent/sdk
```

### Usage

```typescript
import { ZKurrentClient, SuiPaymentSigner } from "@zkurrent/sdk";

const client = new ZKurrentClient({
  apiUrl: "https://api.zkurrent.xyz",
  signer: new SuiPaymentSigner(suiKeypair),
});

// Handle x402 payments automatically
// First call triggers 402 → client pays → retries with tx digest

// Screen DeepBook pools (0.005 SUI)
const { pools } = await client.screenPools({ dex: "deepbook" });

// Verify ZK proof (0.01 SUI)
const { verified } = await client.verifyProof("abc123...");

// Get agent status (0.005 SUI)
const status = await client.getAgentStatus();
```

> Note: `@zkurrent/sdk` is planned. Currently use HTTP API directly with the x402 payment flow above.

---

## Rate Limits

| Tier | Limit | Price Per Call |
|------|-------|---------------|
| Free (no x402) | 10 req/min on free endpoints only | $0 |
| Paid (x402 verified) | 100 req/min on all endpoints | 0.005–0.02 SUI |

Rate limits are enforced per IP for free endpoints and per SUI address for paid endpoints.

---

## Error Response Format

All errors follow the same structure:

```json
{
  "error": "Human-readable error type",
  "message": "Detailed description",
  "details": {}
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-06 | Initial release: x402 endpoints, MCP server, 4 DEX screening |
