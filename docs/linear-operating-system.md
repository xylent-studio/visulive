# Linear Operating System

Date: 2026-04-28  
Workspace: <https://linear.app/visulive>  
Status: Active through the direct `mcp__linear__` connector

## Purpose

Linear is the planning and execution surface for VisuLive. It should answer:

- what the current development goal is
- what is blocked by proof
- which lane owns each change
- which acceptance checks must pass
- what a future AI coding agent should do next

It is not the evidence source of truth. Evidence truth remains local run packages, proof reports, benchmark manifests, recommendation JSON, and checkpoints.

## Connection Status

The official Linear MCP server is registered in Codex global config as `linear` at `https://mcp.linear.app/mcp`, and OAuth login completed successfully on 2026-04-28.

Current confirmed state:

- The direct `mcp__linear__` connector reads the intended `visulive` workspace.
- Team exists as `Visulive` with key `VIS`.
- Labels are seeded: `proof-gate`, `evidence`, `release`, `runtime`, `operator-ux`, `docs`, `artifact-policy`, `governance`, `linear-ops`.
- Project exists: [Proof Backbone & Clean Workspace](https://linear.app/visulive/project/proof-backbone-and-clean-workspace-c336ef31d99c).
- Project document exists: [Proof Backbone Operating Notes](https://linear.app/visulive/document/proof-backbone-operating-notes-df03eeaad9bb).
- Seeded issues exist as `VIS-5` through `VIS-16`.
- `VIS-17` tracks the Proof Mission lifecycle/final eligibility correction that must land before the next canary.
- Active tracker edge: `VIS-17` blocks `VIS-12`; `VIS-12` is the next canary task after this hardening is committed; `VIS-14` is blocked by `VIS-12`; `VIS-13` is blocked by `VIS-14`; `VIS-15` is blocked by `VIS-14` and `VIS-13`; `VIS-16` is blocked by `VIS-15`.

Connector warning:

- Use `mcp__linear__` for VisuLive reads and writes.
- Do not use the stale `mcp__codex_apps__linear_mcp_server` connector for VisuLive writes; in this session it still returned the older `learning-capture-pipeline` workspace.

If direct `mcp__linear__` disappears in a future session, reconnect the official MCP and verify reads show `https://linear.app/visulive` before writing.

## Canonical Team

- Team: `VisuLive`
- Key: `VIS`
- Workspace: `https://linear.app/visulive`

If the team does not exist, create it before importing issues. The key matters because branch names, future issue references, and agent handoffs should converge on `VIS-*`.

## Active Project

Project: `Proof Backbone & Clean Workspace`

Goal: make the active rewrite branch clean, proof-gated, and ready for fresh serious capture before push, deploy, staging, or capability expansion.

Milestones:

- `Clean Source Boundary`
- `Review Finding Closure`
- `Fresh Serious Proof`
- `Evidence-Led Next Development`

## Required Labels

- `proof-gate`
- `evidence`
- `release`
- `runtime`
- `operator-ux`
- `docs`
- `artifact-policy`
- `governance`
- `linear-ops`

## Status Policy

- `Backlog`: valid work item, not selected for current local execution.
- `Ready`: has acceptance criteria, owner lane, proof target, and no unresolved scope ambiguity.
- `In Progress`: currently being changed locally or by an assigned agent.
- `Blocked`: waiting on operator capture, connector auth, external account access, or an explicit dependency.
- `Review`: code/docs complete, verification pending or review findings being checked.
- `Done`: committed with verification and checkpoint.

## Agent Issue Contract

Every issue assigned to an AI coding agent must include:

- owner lane
- exact files or subsystem boundary when practical
- acceptance checks
- proof target or reason proof is not required
- no-go boundaries
- expected verification commands
- whether a checkpoint is required

Do not open broad issues like "improve visuals" without a measurable proof target. Use concrete language such as "reduce ring-overdraw risk in authority-led frames without lowering chamber presence."

## Serious Proof Flow

The current serious proof flow is:

1. `npm run dev:proof`
2. `Backstage -> Capture -> Proof Mission`
3. archive or review any old active inbox run package before starting new proof
4. arm `Proof Wave`
5. verify readiness is green
6. run the mission
7. use `Finish Proof Run`
8. `npm run proof:current`
9. `npm run evidence:index`
10. `npm run run:review -- --run-id <runId>`
11. promote or archive the whole run package
12. update Linear with the run verdict and next tuning target

`npm run proof:current` refreshes reports. It is not a hard gate. Use strict proof-pack and benchmark validation for release/current-canonical decisions.

Linear should never mark a proof issue done based on manual tags alone. The run package must prove the mission-derived scenario.

## Next Development Guardrail

Until fresh current proof exists:

- no staging host work
- no public UX expansion
- no new anthology family
- no capability-growth pass
- no release promotion

If primary benchmark or operator-trust proof fails, the next issue should be a narrow governance correction against `AuthorityGovernor`, `LightingSystem`, or `ParticleSystem`. If proof passes, the next structural issue should be `PostSystem` readiness.

Current issue order:

1. `VIS-17` Correct Proof Mission lifecycle and final eligibility before canary.
2. `VIS-12` Run primary-benchmark proof canary.
3. `VIS-14` Collect clean primary-benchmark proof.
4. `VIS-13` Collect clean operator-trust proof.
5. `VIS-15` Review proof recommendations and decide governance follow-up.
6. `VIS-16` Decide PostSystem readiness after authority proof.
