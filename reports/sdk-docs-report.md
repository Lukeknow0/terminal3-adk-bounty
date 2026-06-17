# Terminal 3 ADK SDK / Docs Report

Verified on 2026-06-17.

## Summary

During a minimal ADK implementation pass, I found three documentation/package metadata issues that can slow down first-time developers. None require private keys or access to a live tenant to reproduce.

## Environment

- Node: v22.22.3
- npm: 10.9.8
- SDK package checked: `@terminal3/t3n-sdk@3.7.0`
- Docs checked:
  - `https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env.md`
  - `https://docs.terminal3.io/developers/adk/get-started/walkthrough/write-contract.md`
  - `https://docs.terminal3.io/developers/adk/tips/placeholders-outbound-calls.md`
  - `https://docs.terminal3.io/developers/adk/tips/seed-api-key.md`

## Finding 1: Node version requirement is inconsistent

### Evidence

- Official setup docs state: `Node >=18 is required`.
- `npm view @terminal3/t3n-sdk --json` reports package metadata `engines.node: >=16.0.0`.

### Impact

Developers on Node 16 may think the SDK is supported from npm metadata, then hit docs/runtime mismatch during onboarding.

### Suggested fix

Align the published `package.json` engine field with the documented minimum, or document exactly which SDK features work on Node 16.

## Finding 2: `http-with-placeholders` Rust snippet uses a different API shape than the walkthrough

### Evidence

The walkthrough uses:

```rust
use crate::host::interfaces::http_with_placeholders as hwp;

let resp = hwp::call(&hwp::Request {
    method: hwp::Verb::Post,
    url: format!("{DUFFEL_BASE}/air/orders"),
    headers: Some(duffel_headers(&api_key)),
    payload: Some(serde_json::to_vec(&order_body).map_err(|e| e.to_string())?),
})?;
```

The placeholders tip page uses a different binding path and field names:

```rust
use crate::bindings::t3n::host::http_with_placeholders as hwp;

let resp = hwp::call(&hwp::Request {
    method:  "POST".to_string(),
    url:     "https://api.duffel.com/air/orders".to_string(),
    headers: vec![...],
    body: Some(serde_json::to_vec(&body)?),
})?;
// resp.body
```

### Impact

New developers may copy the tip-page snippet into the current walkthrough project and hit compile errors because the request type appears to use `Verb`, `headers: Option<Vec<_>>`, `payload`, and `resp.payload`, not `method: String`, `headers: Vec<_>`, `body`, and `resp.body`.

### Suggested fix

Update the tip page to match the current generated bindings used by the walkthrough, or add a version note if the snippet targets an older WIT binding layout.

## Finding 3: `seed-api-key` page conflicts with canonical map-name guidance

### Evidence

The walkthrough says `kv-store` calls take the full `z:<tid>:<map>` name and shows:

```rust
let map_name = format!("z:{}:secrets", hex::encode(&tid));
let bytes = kv_store::get(&map_name, b"duffel_api_key")?;
```

The `seed-api-key` page first says the contract reads from `z:<tid>:secrets`, but later states:

```text
At call time your contract reads it back with kv_store::get("secrets", "duffel_api_key")
```

### Impact

This creates ambiguity about whether contract-side `kv_store::get` expects a canonical map name or a tail. The common-errors page also warns developers to match map names exactly, so this inconsistency is likely to cause avoidable `map not found` or `access denied` debugging.

### Suggested fix

Use the canonical full map name consistently in `seed-api-key.md`, or explicitly state which host API versions accept a tail and which require `z:<tid>:<tail>`.

## Extra note: npm homepage / repository path returns 404

`npm view @terminal3/t3n-sdk --json` lists:

```json
"homepage": "https://github.com/Terminal-3/trinity/tree/main/client/t3n-sdk#readme",
"repository": {
  "url": "git+https://github.com/Terminal-3/trinity.git",
  "directory": "client/t3n-sdk"
}
```

The homepage URL returned HTTP 404 during testing. If the repo is intentionally private, a docs link to the public sample repo or documentation page would give package users a working next step.
