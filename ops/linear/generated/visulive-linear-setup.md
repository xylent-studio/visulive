# VisuLive Linear Setup

Workspace: https://linear.app/visulive
Team: VisuLive
Team key: VIS
Project: Proof Backbone & Clean Workspace

## Connector Truth

- Use the direct `mcp__linear__` connector for VisuLive.
- Do not use the stale `mcp__codex_apps__linear_mcp_server` connector if it reads `learning-capture-pipeline`.
- Before any write, verify the project URL starts with `https://linear.app/visulive/` and the team key is `VIS`.
- If the direct connector is unavailable, reconnect `codex mcp login linear` and verify workspace reads before writing.

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

### Verify Linear workspace scope before seeding

Priority: Urgent
State: Done
Milestone: Clean Source Boundary
Labels: linear-ops

Prevent VisuLive work from being created in the wrong Linear workspace.

Owner lane: Linear Ops.

Acceptance:
- Linear reads visibly target `https://linear.app/visulive`, not `https://linear.app/learning-capture-pipeline`.
- Team is `VisuLive` with key `VIS`.
- Existing projects and issues are checked for duplicates before any writes.
- If OAuth is scoped to the wrong workspace, reconnect Linear before seeding.

### Clean artifact boundaries and ignored generated evidence

Priority: High
State: Done
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
State: Done
Milestone: Clean Source Boundary
Labels: linear-ops, docs

Convert accumulated local work into a clean, reviewable commit stack before fresh serious proof.

Owner lane: Repo Operations.

Acceptance:
- Dirty workspace is converted into focused commits.
- `git status --short` is empty.
- `npm run proof:preflight` passes without `--allow-dirty`.
- Checkpoint records commit stack and next proof steps.

Status note:
- The proof-ops stack is committed and clean; use `git rev-parse --short HEAD` or `npm run proof:preflight` for the exact launch commit.

### Close release/proof gate findings

Priority: Urgent
State: Done
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
State: Done
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
State: Done
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
State: Done
Milestone: Review Finding Closure
Labels: runtime, docs

Machine-readable and prose canon must match current runtime ownership.

Owner lane: Runtime / Docs.

Acceptance:
- Machine-readable anthology catalog reflects HeroSystem owned lifecycle status.
- AGENTS and deployment docs match current runtime and release-gate truth.
- Future agents are directed toward PostSystem and proof-led governance, not stale facade assumptions.

### Run primary-benchmark proof canary

Priority: Urgent
State: In Progress
Milestone: Fresh Serious Proof
Labels: proof-gate, evidence, operator-ux

Run a short proof canary before spending operator time on a full no-touch benchmark.

Owner lane: Operator / Evidence.

Acceptance:
- Run uses `npm run dev:proof`.
- Scenario is `Primary benchmark`.
- Source is PC Audio.
- Duration is 60-90 seconds.
- Run package includes journal, manifest, clips, stills, selected scenario, active no-touch tracking, and zero invalidations.
- Canary is archived or reviewed before the full benchmark run starts.

Current repo truth:
- `npm run proof:preflight` must pass immediately before launch and prints the exact clean commit.
- `captures/inbox/runs` is empty.
- The invalid April 28 run is archived and must be used only as debugging evidence.

### Collect clean primary-benchmark proof

Priority: Urgent
State: Blocked
Milestone: Fresh Serious Proof
Labels: proof-gate, evidence
Blocked by: Run primary-benchmark proof canary

Collect the first serious current authority-validation run on the hardened backbone after the proof canary succeeds.

Owner lane: Operator / Evidence.

Acceptance:
- Run uses `npm run dev:proof`.
- Scenario is `Primary benchmark`.
- Source is PC Audio.
- Duration is 6-8 minutes.
- Run is no-touch, current-proof-eligible, screenshot-backed, and reviewed.
- `npm run proof:current`, `npm run evidence:index`, and `npm run run:review -- --run-id <runId>` complete.
- `authority split validation` and `primary authority proof` gates pass before governance is treated as stable.

Dependency:
- Blocked by `Run primary-benchmark proof canary` because the canary must prove write/journal/still/no-touch reliability before a full benchmark run.

### Collect clean operator-trust proof

Priority: High
State: Blocked
Milestone: Fresh Serious Proof
Labels: proof-gate, operator-ux, evidence
Blocked by: Collect clean primary-benchmark proof

Collect proof that a normal operator can arm and run the show without hidden manual intervention.

Owner lane: Operator UX / Evidence.

Acceptance:
- Scenario is `Operator trust`.
- Duration is 6-8 minutes.
- Operator-trust scenario clears no-touch and intervention requirements.
- Run package is reviewed and promoted or archived as a whole package.
- Any invalidation reason produces actionable operator recovery guidance.

Dependency:
- Blocked by `Collect clean primary-benchmark proof` because operator trust should run only after the primary proof path is proven valid.

### Review proof recommendations and decide governance follow-up

Priority: High
State: Blocked
Milestone: Evidence-Led Next Development
Labels: governance, evidence
Blocked by: Collect clean primary-benchmark proof, Collect clean operator-trust proof

Use fresh recommendation JSON and review notes to choose the next narrow correction.

Owner lane: Governance / Evidence.

Acceptance:
- Recommendation JSON is reviewed.
- Overbright, ring persistence, chamber presence, and world takeover outcomes determine the next correction.
- If proof is weak, next pass is AuthorityGovernor, LightingSystem, and ParticleSystem only.
- If proof is strong, move to PostSystem readiness.

Dependency:
- Blocked by `Collect clean primary-benchmark proof` and `Collect clean operator-trust proof` because governance correction must be evidence-led from valid runs, not stale or invalid captures.

### Decide PostSystem readiness after authority proof

Priority: Medium
State: Blocked
Milestone: Evidence-Led Next Development
Labels: runtime, governance
Blocked by: Review proof recommendations and decide governance follow-up

Decide whether the runtime is ready for the next structural extraction.

Owner lane: Runtime / Governance.

Acceptance:
- If authority proof holds, next structural target is `PostSystem`.
- If authority proof fails, perform one focused governance correction first.
- No capability-growth issue starts until this decision is recorded.

Dependency:
- Blocked by `Review proof recommendations and decide governance follow-up` because PostSystem readiness must follow proof recommendation review, not architecture momentum.

