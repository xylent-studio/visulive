# Linear Handoff: VisuLive Proof Backbone

Date: 2026-04-28
Workspace: https://linear.app/visulive
Status: Official Linear MCP authenticated on 2026-04-28. Labels are seeded. Project and issue writes require interactive confirmation after restarting Codex desktop so the current thread can load the new MCP server.

## Project

Create project:

- Name: `Proof Backbone & Clean Workspace`
- Team: `VisuLive`
- Team key: `VIS`
- Priority: High
- Summary: Make the active rewrite branch clean, proof-gated, and ready for fresh serious capture before any push, deploy, staging, or capability expansion.

## Milestones

- `Clean Source Boundary`
- `Review Finding Closure`
- `Fresh Serious Proof`
- `Evidence-Led Next Development`

## Labels

- `proof-gate`
- `evidence`
- `release`
- `runtime`
- `operator-ux`
- `docs`
- `artifact-policy`
- `governance`
- `linear-ops`

## Issues

### Clean artifact boundaries and ignored generated evidence

Labels: `artifact-policy`, `evidence`

Acceptance:
- Generated SQLite catalogs and run payloads do not dirty Git.
- Heavy v1 preserved artifacts stay out of source Git.
- Lightweight release records, checksums, manifests, and docs remain trackable.

### Commit structured proof-ready workspace stack

Labels: `linear-ops`, `docs`

Acceptance:
- Dirty workspace is converted into focused commits.
- `git status --short` is empty.
- `npm run proof:preflight` passes without `--allow-dirty`.

### Close release/proof gate findings

Labels: `proof-gate`, `release`

Acceptance:
- `release:verify` requires current benchmark truth and strict proof-pack gates.
- `npm run release:verify` fails until fresh valid proof and current-canonical benchmark exist.

### Close run journal/build identity findings

Labels: `proof-gate`, `evidence`

Acceptance:
- Serious proof rejects dev, unverified, dirty, unknown, or invalid build identity.
- Run metadata uses the shared build identity validator.
- Checkpoint still references are registered only after successful save.

### Close run package/catalog/analyzer findings

Labels: `evidence`

Acceptance:
- Run package promotion refuses overwrites.
- Recommendation gates can pass, warn, or fail.
- `after-commit` evidence queries use commit/build timestamps.

### Close runtime/docs anthology truth findings

Labels: `runtime`, `docs`

Acceptance:
- Machine-readable anthology catalog reflects HeroSystem ownership.
- AGENTS and deployment docs match current runtime and release-gate truth.

### Collect clean primary-benchmark proof

Labels: `proof-gate`, `evidence`

Acceptance:
- Run uses `npm run dev:proof`.
- Scenario is `Primary benchmark`.
- Run is no-touch, current-proof-eligible, screenshot-backed, and reviewed.

### Collect clean operator-trust proof

Labels: `proof-gate`, `operator-ux`

Acceptance:
- Operator-trust scenario clears no-touch and intervention requirements.
- Run package is reviewed and promoted or archived as a whole package.

### Review proof recommendations and decide governance follow-up

Labels: `governance`, `evidence`

Acceptance:
- Recommendation JSON is reviewed.
- Overbright, ring persistence, chamber presence, and world takeover outcomes determine the next correction.

### Decide PostSystem readiness after authority proof

Labels: `runtime`, `governance`

Acceptance:
- If authority proof holds, next structural target is `PostSystem`.
- If authority proof fails, perform one focused governance correction first.
