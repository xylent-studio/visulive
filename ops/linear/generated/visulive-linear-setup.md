# VisuLive Linear Setup

Workspace: https://linear.app/visulive
Team: VisuLive
Team key: VIS
Project: Proof Backbone & Clean Workspace

## Connector Recovery

1. Enable or reconnect the Linear app in Codex desktop.
2. Complete OAuth against the `visulive` workspace.
3. Restart the Codex session if MCP tools still fail.
4. Ask Codex to run Linear setup again.

## Project

This project is the operating backbone for the next VisuLive wave: clean committed workspace, strict proof and release gates, trustworthy evidence flow, Linear-backed execution, then fresh serious proof. Current branch decisions must come from fresh valid run packages, not stale April evidence.

## Milestones

- Clean Source Boundary: Generated evidence and heavy release artifacts are ignored or externalized while lightweight provenance stays trackable.
- Review Finding Closure: All proof, release, runtime-truth, and analyzer review findings are closed with regression checks.
- Fresh Serious Proof: Primary benchmark and operator-trust runs are collected through the hard-gated Proof Wave path.
- Evidence-Led Next Development: Fresh recommendations decide governance correction versus PostSystem readiness and later capability growth.

## Labels

- proof-gate: Blocks or validates serious proof, proof-pack, benchmark, or release readiness.
- evidence: Capture, run-package, catalog, proof report, analyzer, or recommendation work.
- release: Manual release, deployment verification, preservation, or production-hosting work.
- runtime: Flagship runtime ownership, system extraction, orchestration, or scene-shell reduction.
- operator-ux: Backstage, diagnostics, proof arming, controls, and human proof workflow.
- docs: Agent canon, runbooks, project status, and documentation truth.
- artifact-policy: Git hygiene, generated artifacts, evidence storage, preservation boundaries.
- governance: Authority, lighting, particles, composition safety, and proof-led correction.
- linear-ops: Linear workspace, issue templates, status workflow, and agent operating system.

## Issues

### Clean artifact boundaries and ignored generated evidence

Priority: High
Milestone: Clean Source Boundary
Labels: artifact-policy, evidence

Generated evidence and heavy release outputs must not dirty source Git while lightweight provenance stays trackable.

Owner lane: Evidence / Capture / Analyzer.

Acceptance:
- Generated SQLite catalogs and run payloads do not dirty Git.
- Heavy v1 preserved artifacts stay out of source Git.
- Lightweight release records, checksums, manifests, and docs remain trackable.
- `git status --short` is clean after proof/report commands.

### Commit structured proof-ready workspace stack

Priority: High
Milestone: Clean Source Boundary
Labels: linear-ops, docs

Convert accumulated local work into a clean, reviewable commit stack before fresh serious proof.

Owner lane: Repo Operations.

Acceptance:
- Dirty workspace is converted into focused commits.
- `git status --short` is empty.
- `npm run proof:preflight` passes without `--allow-dirty`.
- Checkpoint records commit stack and next proof steps.

### Close release/proof gate findings

Priority: Urgent
Milestone: Review Finding Closure
Labels: proof-gate, release

Release verification must not pass when proof gates fail.

Owner lane: Release / Evidence.

Acceptance:
- `release:verify` requires current benchmark truth and strict proof-pack gates.
- `npm run benchmark:validate -- --require-current` fails until active/current-canonical benchmark exists.
- `npm run proof-pack -- --limit 1 --strict` fails until a current-proof-eligible run exists.
- `npm run release:verify` fails until strict proof and benchmark gates pass.

### Close run journal/build identity findings

Priority: Urgent
Milestone: Review Finding Closure
Labels: proof-gate, evidence, operator-ux

Serious proof must reject weak, dirty, or unknown build identity and must not serialize false screenshot references.

Owner lane: Evidence / Operator UX.

Acceptance:
- Serious proof rejects dev, unverified, dirty, unknown, or invalid build identity.
- Run metadata uses the shared build identity validator.
- Checkpoint still references are registered only after successful save.
- Save failure invalidates the proof run with explicit reasons.

### Close run package/catalog/analyzer findings

Priority: High
Milestone: Review Finding Closure
Labels: evidence

Run packages and evidence query tooling must be safe and chronologically honest.

Owner lane: Evidence / Capture / Analyzer.

Acceptance:
- Run package promotion refuses overwrites.
- Recommendation gates can pass, warn, or fail.
- `after-commit` evidence queries use commit/build timestamps, not lexicographic hash comparison.
- Catalog can answer recent failure pattern queries without misleading ordering.

### Close runtime/docs anthology truth findings

Priority: High
Milestone: Review Finding Closure
Labels: runtime, docs

Machine-readable and prose canon must match current runtime ownership.

Owner lane: Runtime / Docs.

Acceptance:
- Machine-readable anthology catalog reflects HeroSystem owned lifecycle status.
- AGENTS and deployment docs match current runtime and release-gate truth.
- Future agents are directed toward PostSystem and proof-led governance, not stale facade assumptions.

### Collect clean primary-benchmark proof

Priority: Urgent
Milestone: Fresh Serious Proof
Labels: proof-gate, evidence

Collect the first serious current proof run on the hardened backbone.

Owner lane: Operator / Evidence.

Acceptance:
- Run uses `npm run dev:proof`.
- Scenario is `Primary benchmark`.
- Source is PC Audio.
- Run is no-touch, current-proof-eligible, screenshot-backed, and reviewed.
- `npm run proof:current`, `npm run evidence:index`, and `npm run run:review -- --run-id <runId>` complete.

### Collect clean operator-trust proof

Priority: High
Milestone: Fresh Serious Proof
Labels: proof-gate, operator-ux, evidence

Collect proof that a normal operator can arm and run the show without hidden manual intervention.

Owner lane: Operator UX / Evidence.

Acceptance:
- Scenario is `Operator trust`.
- Operator-trust scenario clears no-touch and intervention requirements.
- Run package is reviewed and promoted or archived as a whole package.
- Any invalidation reason produces actionable operator recovery guidance.

### Review proof recommendations and decide governance follow-up

Priority: High
Milestone: Evidence-Led Next Development
Labels: governance, evidence

Use fresh recommendation JSON and review notes to choose the next narrow correction.

Owner lane: Governance / Evidence.

Acceptance:
- Recommendation JSON is reviewed.
- Overbright, ring persistence, chamber presence, and world takeover outcomes determine the next correction.
- If proof is weak, next pass is AuthorityGovernor, LightingSystem, and ParticleSystem only.
- If proof is strong, move to PostSystem readiness.

### Decide PostSystem readiness after authority proof

Priority: Medium
Milestone: Evidence-Led Next Development
Labels: runtime, governance

Decide whether the runtime is ready for the next structural extraction.

Owner lane: Runtime / Governance.

Acceptance:
- If authority proof holds, next structural target is `PostSystem`.
- If authority proof fails, perform one focused governance correction first.
- No capability-growth issue starts until this decision is recorded.

