# VisuLive Documentation Operations

Date: 2026-04-23
Status: Active maintainer reference

This document defines how repo truth is supposed to work.

Its job is simple:

- keep the project recoverable if thread context is lost
- stop older doctrine from silently overruling current shipped truth
- make it obvious which file to update when reality changes
- distinguish cleanly between shipped state, canonized target state, and historical material

## Source Precedence

When code and docs disagree, use this order:

1. live code in [src](C:/dev/GitHub/visulive/src), [scripts](C:/dev/GitHub/visulive/scripts), and repo config
2. [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
3. [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
4. [anthology-mastery-charter.md](C:/dev/GitHub/visulive/docs/anthology-mastery-charter.md)
5. [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)
6. [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
7. [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
8. [mastery-review-system.md](C:/dev/GitHub/visulive/docs/mastery-review-system.md)
9. [flagship-runtime-architecture.md](C:/dev/GitHub/visulive/docs/flagship-runtime-architecture.md)
10. [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
11. [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)
12. [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md)
13. [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md)
14. [preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md)
15. [captures/README.md](C:/dev/GitHub/visulive/captures/README.md)
16. [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)
17. [cue-grammar.md](C:/dev/GitHub/visulive/docs/cue-grammar.md)
18. [reference-systems.md](C:/dev/GitHub/visulive/docs/reference-systems.md)
19. [flagship-reference-atlas.md](C:/dev/GitHub/visulive/docs/flagship-reference-atlas.md)
20. [vision-ledger.md](C:/dev/GitHub/visulive/docs/vision-ledger.md)
21. [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md)
22. [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)
23. [outside-dev-brief.md](C:/dev/GitHub/visulive/docs/outside-dev-brief.md)
24. historical docs

Interpretation:

- code is shipped truth
- `project-status.md` is the fastest implementation snapshot
- `current-program.md` defines the active phase, phase order, and promotion model
- `anthology-mastery-charter.md` defines the uncompromising end-state and mastery standard
- `anthology-capability-map.md` defines long-range capability, maturity, and next-target truth
- `runtime-extraction-scoreboard.md` defines current ownership truth and blocking extraction reality
- `graduation-rubric.md` defines exact advancement rules for anthology families
- `mastery-review-system.md` defines the current review set, failure gallery, and review cadence
- `flagship-runtime-architecture.md` defines the active structural target for the rewrite
- `show-language.md` defines the live artistic grammar
- `deployment-operations.md` defines release lane, hosting, and verification policy
- `preserved-editions.md` defines frozen public editions and legacy release history
- `product-charter.md` defines stable principles only
- `vision-ledger.md` holds unresolved bets, not canon
- `outside-dev-brief.md` is external prompt material, not internal authority

## Canonical Reading Order

If context is lost, read in this order:

1. [README.md](C:/dev/GitHub/visulive/README.md)
2. [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
3. [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
4. [anthology-mastery-charter.md](C:/dev/GitHub/visulive/docs/anthology-mastery-charter.md)
5. [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)
6. [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
7. [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
8. one task-relevant reference:
   - [mastery-review-system.md](C:/dev/GitHub/visulive/docs/mastery-review-system.md) for golden references, failure patterns, and review cadence
   - [flagship-runtime-architecture.md](C:/dev/GitHub/visulive/docs/flagship-runtime-architecture.md) for structural extraction or ownership work
   - [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md) for visual behavior
   - [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md) for evidence work
   - [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md) for release, lane, or domain work
   - [preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md) for legacy-release, V1 archive, or release-history work
   - [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md) for operator/control work
   - [documentation-operations.md](C:/dev/GitHub/visulive/docs/documentation-operations.md) only when changing canon routing
9. supporting references only as needed

## Document Roles

### [README.md](C:/dev/GitHub/visulive/README.md)
Use for:

- setup
- run instructions
- operator-facing repo entry

### [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
Use for:

- what is shipped now
- what is installed but unproven
- what is canonized now even if implementation is still catching up
- what is blocking the next real quality jump

Update it when implementation truth changes or when canon moves ahead of implementation in a way maintainers must know immediately.

### [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
Use for:

- the active phase
- the rewrite phase order
- the current leverage order
- the promotion gates
- what we are explicitly not doing next

Update it when priorities, sequence, or promotion rules change.

### [anthology-mastery-charter.md](C:/dev/GitHub/visulive/docs/anthology-mastery-charter.md)
Use for:

- the uncompromising end-state
- what is sacred
- what is disposable
- what counts as compromise

Update it only when the dream itself gets clearer.

### [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md)
Use for:

- anthology families
- capability maturity
- proof status
- graduation targets
- future-agent continuation targets

Update it whenever a family changes maturity, proof status, or next target.

### [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md)
Use for:

- current ownership truth
- blocking extractions
- what still lives in `ObsidianBloomScene.ts`
- what must move before a family can grow safely

Update it whenever structural ownership changes or the biggest blocker changes.

### [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md)
Use for:

- exact `lab`, `frontier`, `flagship`, and `retired` rules
- family-specific proof expectations
- promotion and retirement decisions

Update it when advancement criteria change materially.

### [mastery-review-system.md](C:/dev/GitHub/visulive/docs/mastery-review-system.md)
Use for:

- golden review references
- failure gallery references
- review cadence
- review questions

Update it when the review set or cadence changes materially.

### [flagship-runtime-architecture.md](C:/dev/GitHub/visulive/docs/flagship-runtime-architecture.md)
Use for:

- the target structural shape of the flagship runtime
- ownership rules for policy, runtime, systems, and governors
- shared system contracts and extraction order

Update it when the intended runtime ownership model changes materially.

### [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
Use for:

- visual grammar
- cue grammar in practice
- motion, consequence, and frame-ownership language

Update it when artistic behavior changes materially.

### [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)
Use for:

- public control labels
- quick-start truth
- retired-shell guardrails versus current `Advanced > Backstage` control boundaries

Update it when exposed operator behavior changes.

### [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md)
Use for:

- release lane policy
- host, domain, and deploy truth
- verification workflow
- release identity expectations

### [preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md)
Use for:

- frozen public edition truth
- release-history truth
- legacy-host mapping
- preserved-edition status and notes

Update it when release verification or hosting workflow changes materially.

### [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)
Use for:

- stable principles
- product identity
- non-goals

Do not use it to freeze old implementation taste.

### [vision-ledger.md](C:/dev/GitHub/visulive/docs/vision-ledger.md)
Use for:

- unresolved creative bets
- ideas worth preserving before they are proven or rejected

Do not leave already-promoted truth here.

### [outside-dev-brief.md](C:/dev/GitHub/visulive/docs/outside-dev-brief.md)
Use for:

- external reviewers
- outside specialists
- diagnosis prompts

Do not treat it as live canon.

## Maintenance Rules

- When a change lands in code, update the smallest set of docs that keeps the repo truthful.
- Prefer removing contradicted doctrine over layering on caveats forever.
- If a doc is mostly historical, say so clearly.
- If a file becomes canon, move its distilled truth into the real canon files and demote the source.
- When current implementation and canonized target differ, say so explicitly with labels such as `shipped now`, `canonized but not implemented yet`, or `historical`.
- Structural extraction changes should update [flagship-runtime-architecture.md](C:/dev/GitHub/visulive/docs/flagship-runtime-architecture.md) plus either [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md) or [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md).
- Structural extraction changes should also update [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md) when the blocker, owner, or completion condition changes.
- Release-lane policy changes should update [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md) plus the smallest canon doc needed to keep the repo truthful.
- Preserved-edition or legacy-host changes should update both [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md) and [preserved-editions.md](C:/dev/GitHub/visulive/docs/preserved-editions.md).
