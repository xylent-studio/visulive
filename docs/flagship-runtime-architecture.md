# VisuLive Flagship Runtime Architecture

Date: 2026-04-22
Status: Active canonical architecture target

This file defines the target runtime structure for the flagship rewrite and anthology program.

It is not a historical note.
Use it when changing ownership, extracting systems, or deciding where new anthology behavior belongs.

If this file and the code disagree, the code wins for now.
Then either update this file or keep extracting until the code matches it again.

## Architecture Goal

The flagship should stop being one giant scene that owns everything.

The target is:

- policy separated from render ownership
- one thin runtime that assembles context and sequences systems
- domain-owned systems that manage their own resources and telemetry inputs
- governors that handle sequencing, state evolution, and judgment without becoming second scene files
- an explicit anthology-intent layer between audio truth and compatibility tuning

The rewrite is successful when the flagship is orchestration-first instead of scene-file-first.

## Target Runtime Shape

The target structure is:

```text
src/scene/
  direction/
  runtime/
  systems/
    hero/
    chamber/
    world/
    events/
    motion/
    post/
    compositor/
    memory/
    content/
    stage/
  governors/
```

## Intended Ownership

- `direction/`
  - show acts
  - palette states
  - cue grammar
  - stage intent
  - anthology policy
  - legality and graduation rules
- `runtime/`
  - one flagship runtime that assembles context, sequences systems, applies quality, and gathers telemetry
- `systems/hero/`
  - hero build
  - hero update
  - hero species
  - hero mutation verbs
  - hero palette routing
  - hero safety metrics
- `systems/chamber/`
  - rings
  - halos
  - lattice
  - lasers
  - chamber metrics
- `systems/world/`
  - world sphere
  - stain and flash planes
  - fog
  - atmosphere
  - lighting
  - particles
  - world mutation behavior
- `systems/events/`
  - tactical punctuations
  - pressure
  - orbiting accents
  - burst families
- `systems/motion/`
  - locomotion
  - drift
  - camera
  - spatial phrase work
- `systems/post/`
  - consequence
  - aftermath
  - residue
  - frame-memory spend
- `systems/compositor/`
  - mixed-media layers
  - masks
  - silhouette injections
  - screen-space operations
- `systems/memory/`
  - motif recall
  - recurrence bias
  - scar persistence
- `systems/content/`
  - authored asset packs
  - legality metadata
  - capability family declarations
- `systems/stage/`
  - stage frame
  - sweep and blade behavior
  - large-frame sculpting surfaces
- `governors/`
  - framing
  - macro events
  - director state
  - authority
  - telemetry judgment

## Ownership Rules

These rules are the point of the rewrite:

- direction decides policy, not render code
- runtime decides order and context, not lasting image ownership
- systems own their meshes, materials, textures, disposal, and system-local telemetry inputs
- governors can coordinate systems, but they should not become hidden rendering homes
- no new lasting flagship family should land back in monolithic scene code

What stays out of render systems:

- act choice
- palette scoring
- temporal-window policy
- conductor certainty
- renderer-tier policy
- public UI state as a primary truth source

What stays out of direction policy:

- direct `THREE` ownership
- geometry construction
- material updates
- ad hoc scene disposal

## Standard System Contract

All lasting flagship systems should converge on this contract:

- `build()`
- `update(context)`
- `applyQualityProfile(profile)`
- `collectTelemetryInputs()`
- `dispose()`

The rule behind it is simple:

- the same owner that creates resources should update them
- the same owner that updates resources should expose the telemetry inputs they create
- the same owner that creates resources should dispose them

## Shared Context Families

The runtime should pass explicit typed contexts instead of letting systems read scene internals.

Target context families:

- `AudioConductorContext`
- `ShowDirectionContext`
- `StageIntentContext`
- `FrameUpdateContext`
- `PostDecisionContext`
- `TelemetryInputContext`
- `AnthologyDirectorState`
- `AnthologyPoolState`
- `MusicSemanticState`

These contexts exist to replace hidden scene-local coupling.

## Typed Output Contracts

The rewrite should promote these outputs into explicit contracts rather than implicit scene-local state:

- `PerformanceRegime`
- `CueClass`
- `StageIntent`
- `WorldAuthorityState`
- `HeroAuthorityState`
- `PostSpendIntent`
- `SilenceState`
- `PhraseConfidence`
- `SectionIntent`
- `HeroSpeciesId`
- `HeroMutationVerb`
- `WorldFamilyId`
- `WorldMutationVerb`
- `LookProfileId`
- `ConsequenceMode`
- `AftermathState`
- `LightingRigState`
- `CameraPhrase`
- `ParticleFieldRole`
- `MixedMediaAssetId`
- `MotifId`
- `MemoryState`
- `AnthologyGraduationStatus`

They do not all need to land in one patch.
They do need to become real contracts rather than ambient knowledge.

## Canonical Extraction Order

The rewrite extraction order is:

1. `HeroSystem`
2. `ChamberSystem`
3. `WorldSystem`
4. `PostSystem`
5. `CompositorSystem`
6. `MemorySystem`
7. move remaining telemetry ownership to systems
8. collapse the old flagship scene into runtime-only orchestration
9. delete or reduce wrapper rigs that no longer own real logic

`ObsidianBloomScene.ts` should end this sequence as a thin compatibility shell or disappear behind the new runtime.

## Completion Definition

The architecture pass is complete when:

- the flagship runtime no longer directly owns most meshes or materials
- system update order is explicit and testable
- same-frame telemetry aggregation no longer depends on scene-internal reach-through
- parallel work is safe across hero, world, post, compositor, memory, audio, evidence, renderer, and operator lanes
- new anthology families land in owned systems instead of legacy-style scene growth

## What Not To Do

Do not:

- keep a flat `modules/` graveyard forever
- split work into tiny helper files that still leave ownership in one scene
- let systems reach into sibling internals directly
- move cue policy back into render code
- add new anthology families directly into legacy monolith ownership
