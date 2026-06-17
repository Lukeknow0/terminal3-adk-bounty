# DoraHacks Submission Draft

## Project name

T3 Policy Guard: privacy-aware procurement agent

## One-line summary

A minimal Terminal 3 ADK demo showing how an agent can request a business purchase only when DID-based authorization, allowed egress hosts, spending limits, and privacy-preserving profile placeholders all pass.

## What it demonstrates

- Verifiable identities are modeled as `did:t3n:*` actors: tenant, data owner, and agent.
- A tenant contract name is modeled as `z:<tenant-id>:procurement-policy`, matching Terminal 3's tenant namespace pattern.
- Agent authorization is scoped by function, outbound host, placeholder fields, category, and spend limit.
- PII is represented only as `{{profile.*}}` placeholders in the contract-visible payload. The simulated host resolves them after authorization, so the contract output never contains the raw profile values.
- Deny paths are included for over-budget requests and unapproved egress hosts.
- The project includes a real `@terminal3/t3n-sdk` smoke check and an optional live T3N handshake template that only runs when `T3N_API_KEY` and `RUN_T3N_LIVE=1` are both set.

## Scoring fit

- Completeness (30%): one-command local verification with allow and deny paths.
- SDK integration (40%): imports and checks the latest `@terminal3/t3n-sdk`, follows the documented live auth template, and models `z:<tid>:` tenant naming and user-scoped grants.
- Creativity (30%): enterprise procurement is a practical privacy/compliance use case for agent authorization and placeholder-based PII handling.

## How to run

```bash
npm install
npm run verify
```

Optional live template, only after claiming a Terminal 3 sandbox key:

```bash
T3N_API_KEY=... RUN_T3N_LIVE=1 npm run t3n:template
```

The key is read from `process.env` only and is not written to disk.

## Links to include

- Repository: https://github.com/Lukeknow0/terminal3-adk-bounty
- Demo logs: `evidence/demo-run.log` and `evidence/sdk-smoke.log`
- SDK/docs report: `reports/sdk-docs-report.md`

## Why this is useful

The project keeps the scope intentionally small so judges can verify the ADK concepts quickly: identity, tenant namespace, user-scoped authorization, egress control, placeholder-based privacy, and auditable allow/deny decisions. It is also paired with concrete SDK/docs feedback found during implementation.
