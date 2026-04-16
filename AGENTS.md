# VisuLive Agent Guide

Date: 2026-04-08  
Status: Active agent operating guide

This file exists so future specialized agents can work on VisuLive without repeating the same chaos:
- overlapping edits
- slider-driven guesswork
- stale assumptions about source of truth
- visual changes that regress audio/evidence rigor

If this file and the code disagree, the code wins. If this file and the docs disagree, use the docs listed below in the stated order.

## Start Here

Before changing code, load only the minimum current spine:

1. [README.md](C:/dev/GitHub/visulive/README.md)
2. [project-status.md](C:/dev/GitHub/visulive/docs/project-status.md)
3. [current-program.md](C:/dev/GitHub/visulive/docs/current-program.md)

Then load only the task-relevant reference:
- [show-language.md](C:/dev/GitHub/visulive/docs/show-language.md) for visual/art behavior changes
- [agent-workstreams.md](C:/dev/GitHub/visulive/docs/agent-workstreams.md) for multi-agent lane planning
- [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md) when writing or updating a specialist brief
- [tuning-workflow.md](C:/dev/GitHub/visulive/docs/tuning-workflow.md) for capture/replay/benchmark work
- [documentation-operations.md](C:/dev/GitHub/visulive/docs/documentation-operations.md) only when changing doc structure or canon

## Current Truth

VisuLive is a single flagship show engine with:
- one public scene
- hidden internal acts
- `Music On This PC` as the primary tuning path
- `webgpu / safe` as the real live target tier
- capture/evidence reports as the tuning truth source

The current blockers are:
- hero render grammar still fighting the intended neon/emissive read
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) is too monolithic for safe parallel visual work
- conductor certainty still lags behind the strength of the visual event-spend we want
- low-energy living-music states still need fresh proof that they stay readable, colorful, and stage-active in both `Music On This PC` and `Music In The Room`
- safe-tier quality must stay authored, vivid, and premium

One important current clue from live screenshots:
- the wireframe, seam, and rim direction is stronger than the old filled-shell read
- future hero specialists should push emitted structure and dark-body contrast further, not revert to a softly lit blob

## Specialist Lanes

These are the intended specialist lanes for future agent work.

### 1. Hero Render / Emissive Materials

Own:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

Own specifically:
- `buildHero()`
- `updateHero(...)`
- hero material stack
- aura, seam, fresnel, rim, edges, core, void, membrane, crown, twins, ghost hero

Do not own:
- global renderer bloom/exposure
- act selection
- conductor thresholds

### 2. Chamber / Environment / Lighting / Atmospherics

Own:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)
- [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts)

Own specifically:
- world sphere
- stain/flash planes
- chamber rings
- portal rings
- chroma halos
- laser beams
- fog
- light rig
- post/bloom/exposure interaction

Do not own:
- hero-specific material logic
- conductor semantics

### 3. Show Direction / Acts / Palette / Cue Logic

Own:
- [showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts)
- [visual.ts](C:/dev/GitHub/visulive/src/types/visual.ts)

Own specifically:
- `ShowAct`
- `PaletteState`
- temporal windows
- act hysteresis
- palette holds and transitions
- stable visual-direction contract

This lane should be the only place that decides:
- active act
- palette-state scoring
- temporal window derivation

### 4. Motion / Choreography / Camera / Macro Events

Own:
- [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts)

Own specifically:
- family routing
- macro events
- shell/world drift
- bar/phrase consequence
- camera motion
- satellites, shards, pressure waves

Do not redefine:
- palette policy
- renderer policy
- audio thresholds

### 5. Audio Conductor / Phrase Intelligence

Own:
- [AudioEngine.ts](C:/dev/GitHub/visulive/src/audio/AudioEngine.ts)
- [listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts)
- [audio.ts](C:/dev/GitHub/visulive/src/types/audio.ts)

Own specifically:
- source-mode behavior
- beat/drop/section/release detection
- listening and show-state transitions
- performance intent
- audio diagnostics truth

This lane should be the only place that decides:
- conductor certainty
- show-state confidence
- audio-side trigger semantics

### 6. Evidence / Capture / Analyzer

Own:
- [session.ts](C:/dev/GitHub/visulive/src/replay/session.ts)
- [ReplayController.ts](C:/dev/GitHub/visulive/src/replay/ReplayController.ts)
- [types.ts](C:/dev/GitHub/visulive/src/replay/types.ts)
- [capture-analysis-core.mjs](C:/dev/GitHub/visulive/scripts/capture-analysis-core.mjs)
- [analyze-captures.mjs](C:/dev/GitHub/visulive/scripts/analyze-captures.mjs)
- [watch-captures.mjs](C:/dev/GitHub/visulive/scripts/watch-captures.mjs)

Own specifically:
- capture windows
- evidence-quality flags
- report generation
- inbox/canonical/archive handling
- replay metadata fidelity

### 7. Operator UX / Controls / Diagnostics

Own:
- [App.tsx](C:/dev/GitHub/visulive/src/app/App.tsx)
- [ActivationOverlay.tsx](C:/dev/GitHub/visulive/src/ui/ActivationOverlay.tsx)
- [SettingsPanel.tsx](C:/dev/GitHub/visulive/src/ui/SettingsPanel.tsx)
- [DiagnosticsOverlay.tsx](C:/dev/GitHub/visulive/src/debug/DiagnosticsOverlay.tsx)
- [index.css](C:/dev/GitHub/visulive/src/styles/index.css)
- [tuning.ts](C:/dev/GitHub/visulive/src/types/tuning.ts)

Own specifically:
- quick starts
- controls
- onboarding
- diagnostics presentation
- fullscreen/operator experience

### 8. Renderer / Safe-Tier / Quality Policy

Own:
- [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts)
- [visual.ts](C:/dev/GitHub/visulive/src/types/visual.ts)

Own specifically:
- quality tiers
- safe-tier authoring
- exposure and bloom policy
- backend-specific degradation
- visual telemetry contract

## Parallel Work Rules

Parallel work is safe now only for these disjoint write scopes:
- audio conductor
- evidence/analyzer
- operator UX
- renderer policy
- show-direction contract

Parallel work is not yet safe for multiple visual specialists inside [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) unless:
- one agent owns `buildHero()` / `updateHero(...)`
- one agent owns chamber/world/lighting methods
- one agent owns motion/camera/event methods

If that separation is not explicit for a pass, sequence the work instead of parallelizing it.

## Handoff Contracts

These boundaries are non-negotiable:
- [showDirection.ts](C:/dev/GitHub/visulive/src/scene/showDirection.ts) decides act, palette, and temporal-window intent
- [VisualizerEngine.ts](C:/dev/GitHub/visulive/src/engine/VisualizerEngine.ts) decides renderer-tier, bloom, exposure, and quality policy
- [listeningInterpreter.ts](C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts) decides conductor certainty and audio-side state semantics
- [session.ts](C:/dev/GitHub/visulive/src/replay/session.ts) and [capture-analysis-core.mjs](C:/dev/GitHub/visulive/scripts/capture-analysis-core.mjs) decide evidence judgment and report truth

Do not duplicate those decisions inside other lanes.

## Acceptance Rules

Every specialist pass must answer three things:
- what changed
- what evidence it used
- how to tell if the pass actually worked

Brief structure:
- use [specialist-brief-template.md](C:/dev/GitHub/visulive/docs/specialist-brief-template.md)

For visual passes, use:
- fresh screenshots in [captures/inbox](C:/dev/GitHub/visulive/captures/inbox)
- current live inspection images in [captures/reports](C:/dev/GitHub/visulive/captures/reports)
- latest analyzer report

For audio/evidence passes, use:
- [capture-analysis_latest.md](C:/dev/GitHub/visulive/captures/reports/capture-analysis_latest.md)
- current inbox captures only

## Current Best Next Structural Move

Before heavy parallel visual work, split [ObsidianBloomScene.ts](C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts) into:
- `hero*`
- `chamber/world/lighting*`
- `motion/event/camera*`

Until then, use the specialist lanes above as ownership rules even if the code still lives in one file.
