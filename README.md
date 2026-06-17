# T3 Policy Guard

Minimal Terminal 3 Agent Developer Kit bounty submission: a privacy-aware procurement agent demo plus SDK/docs feedback.

## Bounty status checked

Checked on 2026-06-17.

- Status: open / active.
- Deadline: 2026-06-22 23:59 GMT+8.
- Prize: $2,000 USD cash prize pool, paid in fiat by wire or bank transfer; mirror page also lists $3,000 Google credits for top teams.
- Submission type: submit BUIDLs and/or bugs related to Terminal 3 Agent Dev Kit.
- Scoring: solution completeness 30%, SDK integration 40%, creative SDK application 30%.
- Official links used:
  - DoraHacks page: `https://dorahacks.io/hackathon/t3adkdevchallenge/detail`
  - Terminal 3 ADK product page: `https://www.terminal3.io/products/agent-developer-kit`
  - Terminal 3 docs index: `https://docs.terminal3.io/llms.txt`
  - SDK package: `https://www.npmjs.com/package/@terminal3/t3n-sdk`
  - Claim page: `https://www.terminal3.io/claim-page`
  - SDK repository metadata: `https://github.com/Terminal-3/trinity/tree/main/client/t3n-sdk`

Direct `curl` to DoraHacks was stopped by AWS WAF human verification, so the eligibility details above were cross-checked through DoraHacks search snippets and a competition mirror before implementation. The stop conditions were not triggered because the challenge is still before deadline and lists cash prizes.

## Demo idea

`T3 Policy Guard` is a small procurement agent that models the Terminal 3 ADK flow:

1. A tenant owns a `z:<tid>:procurement-policy` contract.
2. A data owner grants an agent permission to call only two functions.
3. The grant scopes allowed outbound hosts, placeholder fields, categories, and spend limits.
4. The contract-visible payload keeps PII as `{{profile.*}}` placeholders.
5. A simulated host resolves placeholders only after authorization, then returns a redacted receipt.
6. Denied paths show egress and spend-limit controls.

This is intentionally a minimal, reproducible demo. It does not store private keys, cookies, mnemonics, API keys, or sensitive tokens.

## Run locally

```bash
npm install
npm run verify
```

Run only the demo:

```bash
npm run demo
```

Run only the SDK smoke check:

```bash
npm run sdk:smoke
```

## Optional live T3N template

The live template follows the official SDK setup pattern, but it refuses to use a key unless explicitly requested.

```bash
T3N_API_KEY=... RUN_T3N_LIVE=1 npm run t3n:template
```

The key is read from `process.env` only and is not written to disk. Without `T3N_API_KEY`, the command exits cleanly.

## Files

- `src/demo.mjs`: offline minimal ADK-style flow with allow/deny decisions.
- `src/sdk-smoke.mjs`: verifies the installed `@terminal3/t3n-sdk` exports used by the docs.
- `src/t3n-live-template.mjs`: optional live handshake/auth template.
- `reports/dorahacks-submission.md`: text to paste into DoraHacks.
- `reports/sdk-docs-report.md`: docs/package metadata report.
- `evidence/`: generated logs from local verification.

## Submission positioning

This should be submitted as a small BUIDL plus a docs/SDK quality report:

- BUIDL: privacy-aware procurement agent with identity, scoped authorization, egress control, placeholder privacy, and audit logs.
- Report: Node engine mismatch, placeholder docs API-shape mismatch, canonical map-name inconsistency, and npm homepage 404.

The goal is easy judging: clone, `npm install`, `npm run verify`, read the evidence and reports.
