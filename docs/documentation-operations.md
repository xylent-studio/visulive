# VisuLive Documentation Operations

Date: 2026-04-08  
Status: Active maintainer reference

This document defines how the repo documentation is supposed to work.

Its purpose is simple:
- make the project recoverable if thread context is lost
- keep one clear source of truth for the active direction
- prevent future drift between code, planning, and historical notes

## Source Precedence

When docs disagree, use this order of authority:

1. [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)
2. [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
3. [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
4. [cue-grammar.md](C:/dev/GitHub/visulive/docs/cue-grammar.md)
5. [reference-systems.md](C:/dev/GitHub/visulive/docs/reference-systems.md)
6. [flagship-reference-atlas.md](C:/dev/GitHub/visulive/docs/flagship-reference-atlas.md)
7. [vision-ledger.md](C:/dev/GitHub/visulive/docs/vision-ledger.md)
8. [agent-operating-model.md](C:/dev/GitHub/visulive/docs/agent-operating-model.md)
9. [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md)
10. [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)
11. live code in [src](C:/dev/GitHub/visulive/src)
12. [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
13. [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)
14. [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md)
15. [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md)
16. [captures/README.md](C:/dev/GitHub/visulive/captures/README.md)
17. historical baseline docs

Interpretation:
- `product-charter.md` defines product identity, taste, anti-goals, and the north-star show doctrine
- `current-program.md` defines what phase the project is in and what to do next
- `show-language.md` defines how the system is supposed to feel and behave
- `cue-grammar.md` defines how detected musical facts become visual cue classes and consequence
- `reference-systems.md` preserves which external systems are worth learning from and what they are teaching us
- `flagship-reference-atlas.md` is the curated labeled board for principle extraction and subagent work
- `vision-ledger.md` captures high-signal creative and operator ideas before they are either promoted into canon or discarded
- `agent-operating-model.md` defines how specialized agents should split ownership and avoid collisions
- `agent-workstreams.md` defines the specialist lanes, their file ownership, and the recommended order of work
- `specialist-brief-template.md` defines the standard bounded format for future delegated specialist passes
- code defines what currently exists
- `project-status.md` defines the current implementation snapshot and open work
- `control-system-audit.md` defines the current truth about public controls
- `tuning-workflow.md` defines how to evaluate and tune changes
- `deployment-operations.md` defines how the live site is hosted, released, verified, and repaired
- `captures/README.md` defines how saved evidence and generated reports should be organized
- `product-charter.md` remains the taste and product north star and should move rarely
- older phase docs remain reference material, not current marching orders

## Canonical Reading Order

If context is lost, read in this order:

1. [README.md](C:/dev/GitHub/visulive/README.md)
2. [docs/README.md](C:/dev/GitHub/visulive/docs/README.md)
3. [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)
4. [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
5. [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
6. [cue-grammar.md](C:/dev/GitHub/visulive/docs/cue-grammar.md)
7. [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
8. [reference-systems.md](C:/dev/GitHub/visulive/docs/reference-systems.md)
9. [flagship-reference-atlas.md](C:/dev/GitHub/visulive/docs/flagship-reference-atlas.md)
10. [vision-ledger.md](C:/dev/GitHub/visulive/docs/vision-ledger.md)
11. [agent-operating-model.md](C:/dev/GitHub/visulive/docs/agent-operating-model.md)
12. [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md)
13. [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)
14. [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)
15. [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md)
16. [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md)
17. [captures/README.md](C:/dev/GitHub/visulive/captures/README.md)
18. historical baselines only as needed

## Document Roles

### [README.md](C:/dev/GitHub/visulive/README.md)
Use for:
- setup
- run instructions
- operator-facing repo entry
- shortest path into the app

Do not turn it into:
- the full product brief
- a decision log
- a duplicate of the docs folder

### [docs/README.md](C:/dev/GitHub/visulive/docs/README.md)
Use for:
- docs navigation
- doc classification
- read order

Do not turn it into:
- a long design brief
- a changelog

### [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)
Use for:
- the current phase
- the real next sequence
- current priorities
- active boundaries

Update it when:
- the active phase changes
- priorities change
- the project makes a real strategic pivot

### [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
Use for:
- current shipped state
- open work
- blocking issues
- practical execution order

Update it when:
- a meaningful implementation pass lands
- unfinished work changes materially
- build and test readiness changes

### [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md)
Use for:
- visual grammar
- motion grammar
- emotional arc
- signature moment logic
- scene-family intent

Update it when:
- the artistic language changes
- a new major scene family becomes canonical
- control philosophy changes the show behavior materially

### [vision-ledger.md](C:/dev/GitHub/visulive/docs/vision-ledger.md)
Use for:
- preserving high-signal operator ideas
- capturing emerging visual instincts before they vanish into thread history
- recording creative directions that matter but are not yet fully canonical

Update it when:
- a new idea clearly matters but is not yet ready to fully rewrite canon
- operator feedback reveals a repeated creative target
- an idea should survive long enough to be tested on purpose

### [reference-systems.md](C:/dev/GitHub/visulive/docs/reference-systems.md)
Use for:
- external show tools and engines worth learning from
- technical or artistic principles to borrow deliberately
- preventing valuable research from disappearing into thread history

Update it when:
- a new external reference clearly changes the project's direction
- research produces a principle we want to keep reusing
- we decide a formerly important reference is no longer useful

### [agent-operating-model.md](C:/dev/GitHub/visulive/docs/agent-operating-model.md)
Use for:
- specialist ownership boundaries
- collision hotspots
- workstream sequencing
- handoff rules between future agents

Update it when:
- we add or remove a specialist lane
- file ownership boundaries change materially
- the recommended execution order changes

### [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md)
Use for:
- the detailed specialist roster
- lane-specific missions
- owned and forbidden files
- current bottleneck-to-agent mapping
- the practical order for specialist execution

Update it when:
- a specialist lane changes scope
- current blockers move between lanes
- the recommended specialist order changes

### [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)
Use for:
- writing bounded specialist subagent briefs
- preserving owned and forbidden file boundaries
- making delegated work comparable and reviewable

Update it when:
- the standard specialist brief format changes
- acceptance expectations change
- a repeated briefing mistake needs to be prevented

### [control-system-audit.md](C:/dev/GitHub/visulive/docs/control-system-audit.md)
Use for:
- what exposed controls actually do
- which controls are weak, overlapping, or confusing
- what should be renamed, removed, or added

Update it when:
- public controls change
- control naming changes
- a previously proposed control becomes real

### [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md)
Use for:
- how tuning is performed
- scenario packs
- capture and replay workflow
- evaluation standards

Update it when:
- the review workflow changes
- replay tooling is added
- the canonical scenario pack changes

### [deployment-operations.md](C:/dev/GitHub/visulive/docs/deployment-operations.md)
Use for:
- hosting stack truth
- release workflow
- Netlify and Cloudflare ownership boundaries
- custom-domain repair
- post-release verification

Update it when:
- hosting provider or site target changes
- release policy changes
- domain workflow changes
- production verification expectations change

### [captures/README.md](C:/dev/GitHub/visulive/captures/README.md)
Use for:
- evidence library rules
- capture naming and retention
- generated report routing
- the practical storage contract for tuning assets

Update it when:
- capture organization changes
- generated report workflow changes
- canonical evidence expectations change

### [product-charter.md](C:/dev/GitHub/visulive/docs/product-charter.md)
Use for:
- product identity
- taste rules
- anti-goals
- foundational north star

Do not rewrite it every time implementation evolves.
It should move rarely.

### [cue-grammar.md](C:/dev/GitHub/visulive/docs/cue-grammar.md)
Use for:
- cue classes
- detection-to-consequence mapping
- cue state, envelope, and budget
- what a visual cue may affect

Do not use it for:
- audio-side detection semantics
- implementation detail that belongs to a scene system

### [flagship-reference-atlas.md](C:/dev/GitHub/visulive/docs/flagship-reference-atlas.md)
Use for:
- curated reference board
- principle extraction
- labeled stills and clips
- subagent reference intake

Do not use it for:
- a duplicate of `reference-systems.md`
- loose brainstorming

### Historical docs

Current historical docs:
- [phase-0-implementation-spec.md](C:/dev/GitHub/visulive/docs/phase-0-implementation-spec.md)
- [phase-0-review-rubric.md](C:/dev/GitHub/visulive/docs/phase-0-review-rubric.md)
- [next-best-move.md](C:/dev/GitHub/visulive/docs/next-best-move.md)
- [repo-consolidation-plan.md](C:/dev/GitHub/visulive/docs/repo-consolidation-plan.md)

Keep them:
- linkable
- readable
- clearly labeled

Do not treat them as the current plan.

## Change Rules

When making project-level changes:

1. update code first if the change is implementation truth
2. update `current-program.md` if the phase or priorities changed
3. update `project-status.md` if shipped state, open work, or readiness changed
4. update `show-language.md` if the artistic behavior changed materially
5. update `reference-systems.md` if outside tools or references materially inform the new direction
6. update `vision-ledger.md` if new high-signal ideas or operator instincts should be preserved
7. update `agent-operating-model.md` if specialist lanes, ownership, or sequencing changed
8. update `agent-workstreams.md` if specialist workstreams, owned files, or blocker mapping changed
9. update `specialist-brief-template.md` if the standard specialist brief format changes
10. update `control-system-audit.md` if public controls changed
11. update `tuning-workflow.md` if evaluation method changed
12. update `deployment-operations.md` if hosting, release, or domain workflow changed
13. update `captures/README.md` if evidence storage or analysis workflow changed
14. update `README.md` only if operator setup or usage changed
15. update `docs/README.md` if document classification or read order changed

This keeps the docs proportional and avoids rewriting everything every pass.

## What Not To Do

Do not:
- create new strategy docs for every idea burst
- let thread history become the real source of truth
- duplicate the same plan in multiple files
- let historical docs keep reading like active directives
- add more docs when an existing canonical doc should simply be updated

## Maintenance Standard

A new maintainer should be able to answer these questions quickly:
- what is this product now
- what phase is it in
- what should be worked on next
- what are the taste and anti-cheapness rules
- which controls are real and what they do
- how to run and evaluate the app
- how the live site is hosted and released
- which docs are historical versus active

If the docs stop answering those clearly, fix the routing before adding more material.
