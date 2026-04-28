# Linear Operating System

Date: 2026-04-28  
Workspace: <https://linear.app/visulive>  
Status: Official Linear MCP authenticated; current desktop thread needs restart to load the new MCP server

## Purpose

Linear is the planning and execution surface for VisuLive. It should answer:

- what the current development goal is
- what is blocked by proof
- which lane owns each change
- which acceptance checks must pass
- what a future AI coding agent should do next

It is not the evidence source of truth. Evidence truth remains local run packages, proof reports, benchmark manifests, recommendation JSON, and checkpoints.

## Connection Status

The official Linear MCP server is registered in Codex global config as `linear` at `https://mcp.linear.app/mcp`, and OAuth login completed successfully on 2026-04-28. A fresh Codex process can read the workspace and seed labels.

Current confirmed state:

- Team exists as `Visulive`.
- Labels are seeded: `proof-gate`, `evidence`, `release`, `runtime`, `operator-ux`, `docs`, `artifact-policy`, `governance`, `linear-ops`.
- Project and issue creation still require interactive MCP write confirmation. The nested non-interactive `codex exec` path cannot display that confirmation and reports project/issue saves as cancelled.

Recovery steps:

1. Restart Codex desktop so this thread reloads the new `linear` MCP server from `C:\Users\jjdog\.codex\config.toml`.
2. Ask Codex to finish Linear setup from [ops/linear/visulive-linear-os.seed.json](C:/dev/GitHub/visulive/ops/linear/visulive-linear-os.seed.json).
3. Approve Linear write confirmations for project and issue creation.

If interactive write confirmation still fails, import the generated CSV from [ops/linear/generated/visulive-linear-issues.csv](C:/dev/GitHub/visulive/ops/linear/generated/visulive-linear-issues.csv) and use [ops/linear/generated/visulive-linear-setup.md](C:/dev/GitHub/visulive/ops/linear/generated/visulive-linear-setup.md) as the manual setup checklist.

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
2. `Backstage -> Capture -> Proof Scenario`
3. arm `Proof Wave`
4. verify readiness is green
5. run the scenario
6. `npm run proof:current`
7. `npm run evidence:index`
8. `npm run run:review -- --run-id <runId>`
9. promote or archive the whole run package
10. update Linear with the run verdict and next tuning target

Linear should never mark a proof issue done based on manual tags alone. The run package must prove the scenario.

## Next Development Guardrail

Until fresh current proof exists:

- no staging host work
- no public UX expansion
- no new anthology family
- no capability-growth pass
- no release promotion

If primary benchmark or operator-trust proof fails, the next issue should be a narrow governance correction against `AuthorityGovernor`, `LightingSystem`, or `ParticleSystem`. If proof passes, the next structural issue should be `PostSystem` readiness.
