# Auth.md — ZKurrent Agent Registration

> ZKurrent uses **x402 micropayments** for authentication — no OAuth, no API keys, no sign-ups.

## How Agents Authenticate

1. Send SUI to the payment address
2. Include the transaction digest in the `Authorization` header
3. Server verifies the on-chain payment and processes the request

## Authorization Header

```
Authorization: x402 <sui-transaction-digest>
```

## Payment Address

See `/.well-known/api-catalog` for current payment address and per-endpoint pricing.

## Supported Identity Types

- `sui_address` — SUI wallet address (verified via on-chain tx signature)
- `midnight_did` — Midnight DID (for ZK proof verification, Phase 2)

## Register

No registration required. Pay per use. Your SUI address is your identity.

## Credential Types

- `x402-sui-payment` — SUI native coin micropayment proof
- `zk-strategy-proof` — Midnight ZK attestation of strategy compliance (Phase 2)

## Token Expiry

Payments are valid for 15 minutes from transaction timestamp. After expiry, a new payment is required.

## Revocation

No revocation needed. Each payment is a one-time proof tied to a specific transaction digest. Replay is prevented by the 15-minute expiry window.
