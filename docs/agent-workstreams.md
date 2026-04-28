# VisuLive Agent Workstreams

Date: 2026-04-22
Status: Active specialist workstream map

This document defines how to split VisuLive work now that the project is aiming at an anthology engine rather than a single fixed image grammar.

The rule is:

- one public portal
- one simple `Start Show` path
- one optional `Advanced` layer
- many internal anthology families under active development

Specialization is how that ambition stays coherent.

## Anthology Operating Rule

Future specialists should optimize for:

- deeper internal repertoire
- stronger autonomous no-touch quality
- explicit graduation from `lab` to `frontier` to `flagship`

They should not optimize for:

- front-door complexity
- more public controls by default
- new lasting families landing in the monolith

Use [anthology-capability-map.md](C:/dev/GitHub/visulive/docs/anthology-capability-map.md) as the capability scoreboard.
Use [runtime-extraction-scoreboard.md](C:/dev/GitHub/visulive/docs/runtime-extraction-scoreboard.md) as the structural blocker scoreboard.
Use [graduation-rubric.md](C:/dev/GitHub/visulive/docs/graduation-rubric.md) as the advancement contract.

## Default Specialist Roster

### 1. Hero Ecology

Mission:
- build hero species, hero mutation verbs, and non-monopoly hero behavior

Primary ownership:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) until extraction completes
- future `systems/hero/*`

Success looks like:
- more than one hero ontology
- quiet hero states remain legible
- hero suppression or world-as-hero can happen without collapse

### 2. World Grammar / Mutation

Mission:
- make chamber and world families behave like authored grammars that can mutate with the music

Primary ownership:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) until extraction completes
- future `systems/chamber/*`
- future `systems/world/*`

Success looks like:
- world-led images are common enough to feel intentional
- mutation changes the frame, not just object styling

### 3. Consequence / Aftermath / Post

Mission:
- turn post and residue into earned consequence instead of permanent treatment

Primary ownership:
- current post logic in scene/runtime
- future `systems/post/*`

Success looks like:
- impact, haunt, collapse, wipe, and recovery read differently
- aftermath remains visible without monopolizing the run

### 4. Lighting / Cinematography

Mission:
- make lighting and camera equal authors instead of support layers

Primary ownership:
- current light and camera ownership in scene/runtime
- future `systems/world/*`
- future `systems/motion/*`

Success looks like:
- cue-linked light states
- camera phrases that change the shot class over time
- strong room-scale readability on `safe`

### 5. Particles / Fields

Mission:
- give particle and field behavior dramatic jobs instead of ambient decoration

Primary ownership:
- current particle systems
- future `systems/world/*`

Success looks like:
- particles can read as weather, offspring, punctuation, residue, or memory echo

### 6. Mixed Media / Compositor / Content

Mission:
- build disciplined browser-native mixed-media vocabulary for consequence, masking, and memory

Primary ownership:
- future `systems/compositor/*`
- future `systems/content/*`

Success looks like:
- mixed media feels authored, sparse, and legible
- it strengthens the show instead of turning into collage

### 7. Motif / Memory

Mission:
- make the show remember itself through motifs, scars, and altered revisitation

Primary ownership:
- future `systems/memory/*`
- analyzer support for recurrence and memory proof

Success looks like:
- motifs recur with intent
- scars and returns feel authored instead of repetitive

### 8. Music Semantics / Conductor

Mission:
- make the show trust the music with more nuance than raw energy and raw drops

Primary ownership:
- [AudioEngine.ts](C:/dev/GitHub/visulive/src/audio/AudioEngine.ts)
- [listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts)
- [audio.ts](C:/dev/GitHub/visulive/src/types/audio.ts)

Success looks like:
- stronger regime distinction
- better silence and sparse-music behavior
- fewer false surges and flatter cue decisions

### 9. Evidence / Proof / Analyzer

Mission:
- keep anthology growth honest and measurable

Primary ownership:
- [session.ts](C:/dev/GitHub/visulive/src/replay/session.ts)
- [ReplayController.ts](C:/dev/GitHub/visulive/src/replay/ReplayController.ts)
- [types.ts](C:/dev/GitHub/visulive/src/replay/types.ts)
- analyzer and capture scripts

Success looks like:
- no-touch runs are comparable
- anthology families can be judged for coverage and graduation
- weak evidence cannot poison the loop

### 10. Operator UX / Trust

Mission:
- keep the public portal simple while exposing useful truth behind `Advanced`

Primary ownership:
- [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx)
- active UI shell files
- [index.css](C:/dev/GitHub/visulive/src/styles/index.css)

Success looks like:
- startup is obvious in under 5 seconds
- `Advanced` remains optional
- new anthology depth does not leak into front-door clutter

### 11. Runtime / Ownership Extraction

Mission:
- move the show to orchestration-first runtime ownership so anthology work stops piling into one file

Primary ownership:
- [flagship-runtime-architecture.md](C:/dev/GitHub/visulive/docs/flagship-runtime-architecture.md)
- scene/runtime/system extraction targets

Success looks like:
- hero, chamber, world, post, compositor, and memory work have real owners
- new families stop landing in legacy monolithic ownership

## Parallel-Safe Work Right Now

These lanes are safe in parallel:

- Music Semantics / Conductor
- Evidence / Proof / Analyzer
- Operator UX / Trust
- renderer-quality policy work
- direction-contract work

These lanes still need explicit write ownership or sequencing:

- Hero Ecology
- World Grammar / Mutation
- Lighting / Cinematography
- Consequence / Aftermath / Post

The reason is unchanged:

- too much lasting visual ownership still overlaps in [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

## Required Shape Of A Wave

Each serious wave should specify:

- one capability family or bottleneck
- one owning lane
- one runtime ownership status
- one proof target
- one graduation target
- one next dependency
- one failure pattern to reduce

Every continuation brief should also say:

- what family maturity changed, if any
- what is still blocking the family
- what the next agent should do next

Use:

- [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)

## Recommended Execution Order

The current highest-leverage sequence is:

1. Runtime / Ownership Extraction
2. Music Semantics / Conductor
3. Consequence / Aftermath / Post
4. World Grammar / Mutation
5. Hero Ecology
6. Lighting / Cinematography
7. Mixed Media / Compositor / Content
8. Motif / Memory
9. Evidence / Proof / Analyzer
10. Operator UX / Trust
11. Runtime / Ownership Extraction

That order is deliberate.

The project needs deeper repertoire, but it needs it through owned systems and proof-backed graduation, not by piling more visible options on the front of the product.
