# ZKurrent — The Autonomous Liquidity Current

> ZK-shielded execution for AI agents on Sui. One current. Every agent.

## What It Is

ZKurrent is a zero-knowledge verified autonomous liquidity provision agent. LP execution runs on Sui (DeepBook, Cetus CLMM, Cetus DLMM, Turbos). ZK attestations live on Midnight Network. x402-gated API for machine-to-machine micropayments.

## For Traders

Deploy a turnkey autonomous LP agent. It screens 4 DEX types, opens positions, manages PnL, and proves performance via Midnight ZK proofs. No code needed.

## For Builders

REST API + MCP server. Other AI agents pay fractions of a cent in SUI to route through ZKurrent's ZK-shielded execution rails. No API keys. No sign-ups. Machine-to-machine micropayments.

## Quick Links

- **Dashboard**: https://zkurrent.xyz/dashboard
- **API Reference**: https://github.com/mzf11125/zkurrent/blob/main/API.md
- **GitHub**: https://github.com/mzf11125/zkurrent
- **MCP Server**: https://zkurrent.xyz/.well-known/mcp
- **API Catalog**: https://zkurrent.xyz/.well-known/api-catalog

## DEX Coverage

- DeepBook V3 (orderbook)
- Cetus CLMM (concentrated liquidity)
- Cetus DLMM (dynamic multi-bin liquidity)
- Turbos CLMM (concentrated liquidity)

## Security

4-layer Bastion Agentic Defense: input sanitization, per-agent policy engine, ZK circuit enforcement on Midnight, immutable decision audit trail.

## Tech Stack

Sui Move · Midnight Compact · LangChain.js + LangGraph · DeepSeek V4 Pro · Supabase · Pyth On-Chain · Effectstream · React 19 · Vite 8 · Hono · x402

## Start

```bash
git clone https://github.com/mzf11125/zkurrent.git
cd zkurrent && pnpm install
pnpm frontend:dev
```

Open http://localhost:5173
