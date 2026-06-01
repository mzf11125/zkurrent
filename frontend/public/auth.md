# Auth.md — ZKurrent Agent Registration

x402 micropayments. No API keys. No sign-ups.

## Register

No registration. Your SUI address is your identity. Send SUI. Include tx digest.
See `/.well-known/api-catalog` for payment address and pricing.

## register_uri

https://zkurrent.xyz/auth.md

## identity_types

- `sui_address`

## credential_types

- `x402-sui-payment`

## claim_url

https://zkurrent.xyz/api/v1/auth/claim

## revocation_url

https://zkurrent.xyz/api/v1/auth/revoke

## Token Expiry

15 minutes from tx timestamp. Replay prevented by expiry window.
